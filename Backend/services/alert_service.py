from collections import deque
from datetime import datetime, timezone
import json
from typing import Any
from uuid import uuid4

from fastapi import BackgroundTasks

from ingestion_layer.constant import REGION_DATA
from integrations.whatsapp import get_configuration_status, send_alert_to_subscribers


alerts: deque[dict[str, Any]] = deque(maxlen=500)
automatic_alert_fingerprints: deque[str] = deque(maxlen=500)


async def emit_risk_assessment_alert(
    region_key: str,
    result: dict[str, Any],
    background_tasks: BackgroundTasks,
    socket_server,
) -> None:
    assessment = result.get("risk_assessment") or {}
    risk_level = assessment.get("level")
    severity_by_level = {"YELLOW": "moderate", "ORANGE": "high", "RED": "critical"}
    severity = severity_by_level.get(risk_level)
    if severity is None:
        return

    conditions = result.get("current_conditions") or {}
    data_quality = result.get("data_quality") or {}
    if data_quality.get("telemetry_status") != "AVAILABLE":
        return

    fingerprint = json.dumps(
        {
            "region": region_key,
            "observed_at": data_quality.get("telemetry_timestamp"),
            "risk_level": risk_level,
            "risk_score": assessment.get("score"),
            "conditions": conditions,
        },
        sort_keys=True,
        default=str,
    )
    if fingerprint in automatic_alert_fingerprints:
        return
    automatic_alert_fingerprints.append(fingerprint)

    region = REGION_DATA.get(region_key, {})
    factors = assessment.get("factors") or []
    record = {
        "id": str(uuid4()),
        "hazard_type": "coastal_weather_risk",
        "severity": severity,
        "title": f"{risk_level} risk screening · {region.get('name', region_key)}",
        "description": (
            f"APADA-SETU screening detected {risk_level} risk (score {assessment.get('score', 0)}). "
            "This is not an official warning or evacuation order. Factors: "
            f"{'; '.join(str(factor) for factor in factors) or 'elevated current conditions'}."
        ),
        "location": {
            "name": region.get("name", region_key),
            "region_key": region_key,
            "latitude": (region.get("min_lat", 0) + region.get("max_lat", 0)) / 2,
            "longitude": (region.get("min_lon", 0) + region.get("max_lon", 0)) / 2,
        },
        "source": "APADA-SETU deterministic risk screening",
        "observed_at": data_quality.get("telemetry_timestamp") or result.get("generated_at"),
        "received_at": datetime.now(timezone.utc).isoformat(),
        "measurements": {
            **conditions,
            "risk_score": assessment.get("score"),
            "risk_factors": factors,
        },
    }
    alerts.appendleft(record)
    await socket_server.emit("climate_alert", record)
    if get_configuration_status()["delivery_configured"]:
        background_tasks.add_task(send_alert_to_subscribers, record)


async def publish_alert(
    record: dict[str, Any],
    background_tasks: BackgroundTasks,
    socket_server,
    *,
    notify_subscribers: bool = True,
) -> None:
    alerts.appendleft(record)
    await socket_server.emit("climate_alert", record)
    if notify_subscribers and get_configuration_status()["delivery_configured"]:
        background_tasks.add_task(send_alert_to_subscribers, record)
