import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

INGESTED_DIR = Path(__file__).resolve().parent.parent / "data" / "ingested"


def _cache_path(filename):
    if Path(filename).name != filename:
        return None
    return INGESTED_DIR / filename


def load_json_cache(
    filename,
    max_age,
    *,
    payload_key=None,
    region_key=None,
    expected_metadata=None,
    use_file_mtime=False,
    validator=None,
):
    cache_path = _cache_path(filename)
    if cache_path is None:
        return None

    try:
        with cache_path.open(encoding="utf-8") as cache_file:
            cache_data = json.load(cache_file)
        if not isinstance(cache_data, dict):
            return None

        payload = cache_data.get(payload_key) if payload_key else cache_data
        if payload is None:
            return None

        if region_key is not None:
            cached_region = cache_data.get("region_target")
            if cached_region is None and isinstance(payload, dict):
                cached_region = payload.get("region_target")
            if cached_region != region_key:
                return None
        if expected_metadata and any(
            cache_data.get(key) != value for key, value in expected_metadata.items()
        ):
            return None

        if use_file_mtime:
            timestamp = datetime.fromtimestamp(cache_path.stat().st_mtime, timezone.utc)
        else:
            timestamp_value = cache_data.get("timestamp")
            if not isinstance(timestamp_value, str):
                return None
            timestamp = datetime.fromisoformat(timestamp_value.replace("Z", "+00:00"))
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)

        age = datetime.now(timezone.utc) - timestamp
        if not timedelta(0) <= age <= max_age:
            return None
        if validator is not None and not validator(payload):
            return None
        return payload
    except (OSError, ValueError, TypeError, KeyError, AttributeError):
        return None


def save_json_cache(filename, payload, *, payload_key=None, metadata=None):
    cache_path = _cache_path(filename)
    if cache_path is None:
        return False

    cache_data = payload
    if payload_key:
        cache_data = {
            **(metadata or {}),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            payload_key: payload,
        }

    try:
        INGESTED_DIR.mkdir(parents=True, exist_ok=True)
        with cache_path.open("w", encoding="utf-8") as cache_file:
            json.dump(cache_data, cache_file, indent=2)
        return True
    except OSError as error:
        print(f"[CACHE] Unable to save {filename}: {error}")
        return False