import hashlib
import hmac
import json
import logging
import os
from pathlib import Path
import re
import secrets
import sqlite3
import time

from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client

logger = logging.getLogger(__name__)
PHONE_PATTERN = re.compile(r"^\+[1-9]\d{7,14}$")
DEFAULT_SANDBOX_FROM = "+14155238886"


class WhatsAppNotConfigured(RuntimeError):
    pass


class VerificationRateLimit(RuntimeError):
    pass


class InvalidVerification(RuntimeError):
    pass


def _database_path():
    configured_path = os.getenv("WHATSAPP_DATABASE_PATH")
    if configured_path:
        return Path(configured_path).expanduser()
    return Path(__file__).resolve().parent / ".local" / "whatsapp.sqlite3"


def _connect():
    database_path = _database_path()
    database_path.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(database_path, timeout=10)


def _initialize_database():
    with _connect() as connection:
        connection.execute(
            """CREATE TABLE IF NOT EXISTS whatsapp_subscribers (
                phone TEXT PRIMARY KEY,
                verified_at TEXT NOT NULL,
                subscribed_at TEXT NOT NULL
            )"""
        )
        connection.execute(
            """CREATE TABLE IF NOT EXISTS whatsapp_verification_limits (
                phone TEXT PRIMARY KEY,
                window_started REAL NOT NULL,
                attempt_count INTEGER NOT NULL,
                last_attempt REAL NOT NULL
            )"""
        )
        connection.execute(
            """CREATE TABLE IF NOT EXISTS whatsapp_verifications (
                phone TEXT PRIMARY KEY,
                code_hash TEXT NOT NULL,
                expires_at REAL NOT NULL,
                attempts INTEGER NOT NULL DEFAULT 0
            )"""
        )


def _delivery_credentials_ready():
    return bool(os.getenv("TWILIO_ACCOUNT_SID") and os.getenv("TWILIO_AUTH_TOKEN"))


def _verification_credentials_ready():
    return _delivery_credentials_ready() and bool(os.getenv("TWILIO_WHATSAPP_OTP_CONTENT_SID"))


def _sandbox_sender():
    sender = os.getenv("TWILIO_WHATSAPP_SANDBOX_FROM", DEFAULT_SANDBOX_FROM).strip()
    return sender if sender.startswith("whatsapp:") else f"whatsapp:{sender}"


def get_configuration_status():
    return {
        "verification_configured": _verification_credentials_ready(),
        "delivery_configured": _delivery_credentials_ready(),
    }


def _client():
    return Client(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])


def _validate_phone(phone):
    if not PHONE_PATTERN.fullmatch(phone):
        raise ValueError("Phone number must be in E.164 format, for example +14155552671.")


def _verification_code_hash(phone, code):
    secret = os.environ["TWILIO_AUTH_TOKEN"].encode()
    value = f"{phone}:{code}".encode()
    return hmac.new(secret, value, hashlib.sha256).hexdigest()


def _record_verification_attempt(phone):
    _initialize_database()
    now = time.time()
    with _connect() as connection:
        connection.execute("BEGIN IMMEDIATE")
        row = connection.execute(
            "SELECT window_started, attempt_count, last_attempt "
            "FROM whatsapp_verification_limits WHERE phone = ?",
            (phone,),
        ).fetchone()

        if row is not None and now - row[0] < 60:
            raise VerificationRateLimit("Wait one minute before requesting another WhatsApp code.")
        if row is not None and now - row[0] < 3600 and row[1] >= 3:
            raise VerificationRateLimit("Too many code requests for this number. Try again in an hour.")

        window_started = row[0] if row is not None and now - row[0] < 3600 else now
        attempt_count = row[1] + 1 if row is not None and now - row[0] < 3600 else 1
        connection.execute(
            "INSERT INTO whatsapp_verification_limits "
            "(phone, window_started, attempt_count, last_attempt) VALUES (?, ?, ?, ?) "
            "ON CONFLICT(phone) DO UPDATE SET window_started = excluded.window_started, "
            "attempt_count = excluded.attempt_count, last_attempt = excluded.last_attempt",
            (phone, window_started, attempt_count, now),
        )


def start_verification(phone):
    _validate_phone(phone)
    if not _verification_credentials_ready():
        raise WhatsAppNotConfigured(
            "Twilio WhatsApp Sandbox credentials or OTP Content SID are not configured on the backend."
        )
    _record_verification_attempt(phone)

    code = f"{secrets.randbelow(1_000_000):06d}"
    with _connect() as connection:
        connection.execute(
            "INSERT INTO whatsapp_verifications (phone, code_hash, expires_at, attempts) "
            "VALUES (?, ?, ?, 0) ON CONFLICT(phone) DO UPDATE SET "
            "code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0",
            (phone, _verification_code_hash(phone, code), time.time() + 600),
        )

    sent = send_whatsapp_template_message(phone, {"1": code})
    if not sent:
        with _connect() as connection:
            connection.execute("DELETE FROM whatsapp_verifications WHERE phone = ?", (phone,))
        raise RuntimeError(
            "Twilio Sandbox could not send the verification code. Confirm the number joined this Sandbox "
            "and its WhatsApp session is active."
        )


def check_verification(phone, code, action):
    _validate_phone(phone)
    if not _delivery_credentials_ready():
        raise WhatsAppNotConfigured("Twilio WhatsApp Sandbox credentials are not configured on the backend.")

    _initialize_database()
    failure = None
    is_new_subscription = False
    with _connect() as connection:
        row = connection.execute(
            "SELECT code_hash, expires_at, attempts FROM whatsapp_verifications WHERE phone = ?",
            (phone,),
        ).fetchone()
        if row is None:
            failure = "No active verification code exists. Request a new code."
        elif row[1] <= time.time():
            connection.execute("DELETE FROM whatsapp_verifications WHERE phone = ?", (phone,))
            failure = "The verification code expired. Request a new code."
        elif row[2] >= 5:
            connection.execute("DELETE FROM whatsapp_verifications WHERE phone = ?", (phone,))
            failure = "Too many incorrect attempts. Request a new code."
        elif not hmac.compare_digest(row[0], _verification_code_hash(phone, code)):
            connection.execute(
                "UPDATE whatsapp_verifications SET attempts = attempts + 1 WHERE phone = ?",
                (phone,),
            )
            failure = "The verification code is incorrect."
        else:
            connection.execute("DELETE FROM whatsapp_verifications WHERE phone = ?", (phone,))
            if action == "subscribe":
                was_already_subscribed = connection.execute(
                    "SELECT 1 FROM whatsapp_subscribers WHERE phone = ?",
                    (phone,),
                ).fetchone() is not None
                from datetime import datetime, timezone

                verified_at = datetime.now(timezone.utc).isoformat()
                connection.execute(
                    "INSERT INTO whatsapp_subscribers (phone, verified_at, subscribed_at) VALUES (?, ?, ?) "
                    "ON CONFLICT(phone) DO UPDATE SET verified_at = excluded.verified_at, "
                    "subscribed_at = excluded.subscribed_at",
                    (phone, verified_at, verified_at),
                )
                is_new_subscription = not was_already_subscribed
            else:
                connection.execute("DELETE FROM whatsapp_subscribers WHERE phone = ?", (phone,))

    if failure:
        raise InvalidVerification(failure)
    return is_new_subscription


def _subscribed_numbers():
    _initialize_database()
    with _connect() as connection:
        return [row[0] for row in connection.execute("SELECT phone FROM whatsapp_subscribers")]


def send_whatsapp_message(phone, body):
    if not _delivery_credentials_ready():
        logger.info("WhatsApp delivery skipped; Twilio Sandbox credentials are not configured.")
        return False

    _validate_phone(phone)
    try:
        _client().messages.create(
            from_=_sandbox_sender(),
            to=f"whatsapp:{phone}",
            body=body[:1500],
        )
    except TwilioRestException as error:
        logger.warning("Twilio WhatsApp Sandbox send failed (code %s).", error.code)
        return False
    return True


def send_whatsapp_template_message(phone, variables):
    if not _verification_credentials_ready():
        logger.info("WhatsApp OTP skipped; Sandbox OTP template is not configured.")
        return False

    _validate_phone(phone)
    try:
        _client().messages.create(
            from_=_sandbox_sender(),
            to=f"whatsapp:{phone}",
            content_sid=os.environ["TWILIO_WHATSAPP_OTP_CONTENT_SID"],
            content_variables=json.dumps(variables),
        )
    except TwilioRestException as error:
        logger.warning("Twilio WhatsApp Sandbox OTP template send failed (code %s).", error.code)
        return False
    return True


def send_welcome_message(phone):
    send_whatsapp_message(
        phone,
        "Welcome to CIIVF WhatsApp alerts. Your number is verified and subscribed to climate-risk notifications. "
        "To stop receiving alerts, unsubscribe in CIIVF Settings.",
    )


def send_alert_to_subscribers(alert):
    if not _delivery_credentials_ready():
        logger.info("WhatsApp alert delivery skipped; Twilio Sandbox is not configured.")
        return

    phones = _subscribed_numbers()
    if not phones:
        return

    sent_count = 0
    for phone in phones:
        body = (
            f"CIIVF climate alert\nSeverity: {str(alert['severity']).upper()}\n"
            f"Location: {alert['location']['name']}\n{alert['title']}\n\n{alert['description']}"
        )
        if send_whatsapp_message(phone, body):
            sent_count += 1

    logger.info("WhatsApp Sandbox climate alert sent to %s of %s subscribers.", sent_count, len(phones))