from fastapi import APIRouter, BackgroundTasks, HTTPException

from schemas.requests import WhatsAppVerificationCheck, WhatsAppVerificationStart
from integrations.whatsapp import (
    InvalidVerification,
    VerificationRateLimit,
    WhatsAppNotConfigured,
    check_verification,
    get_configuration_status,
    send_welcome_message,
    start_verification,
)


router = APIRouter()


@router.get("/api/whatsapp/configuration")
def whatsapp_configuration():
    return get_configuration_status()


@router.post("/api/whatsapp/verification/start", status_code=202)
def start_whatsapp_verification(request: WhatsAppVerificationStart):
    try:
        start_verification(request.phone)
        return {"status": "pending"}
    except VerificationRateLimit as error:
        raise HTTPException(status_code=429, detail=str(error))
    except WhatsAppNotConfigured as error:
        raise HTTPException(status_code=503, detail=str(error))
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error))


@router.post("/api/whatsapp/verification/check")
def check_whatsapp_verification(
    request: WhatsAppVerificationCheck,
    background_tasks: BackgroundTasks,
):
    try:
        is_new_subscription = check_verification(request.phone, request.code, request.action)
        welcome_message = "not_applicable"
        if request.action == "subscribe":
            if is_new_subscription and get_configuration_status()["delivery_configured"]:
                background_tasks.add_task(send_welcome_message, request.phone)
                welcome_message = "queued"
            elif is_new_subscription:
                welcome_message = "not_configured"
            else:
                welcome_message = "already_subscribed"
        return {
            "status": "approved",
            "action": request.action,
            "welcome_message": welcome_message,
        }
    except InvalidVerification as error:
        raise HTTPException(status_code=400, detail=str(error))
    except WhatsAppNotConfigured as error:
        raise HTTPException(status_code=503, detail=str(error))
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error))
