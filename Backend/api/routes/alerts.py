from datetime import datetime, timezone
import hmac
import os
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Query, Request

from ingestion_layer.constant import REGION_DATA
from schemas.requests import ClimateAlertInput, SimulatorAlertInput
from services.alert_service import alerts, publish_alert
from integrations.whatsapp import get_configuration_status, send_whatsapp_message


router = APIRouter()


@router.get("/api/alerts")
def list_alerts(limit: int = Query(100, ge=1, le=500)):
    return [alert for alert in alerts if not alert.get("is_simulation")][:limit]


@router.post("/api/alerts", status_code=201)
async def ingest_alert(
    alert: ClimateAlertInput,
    request: Request,
    background_tasks: BackgroundTasks,
    x_alert_ingest_token: str | None = Header(default=None),
):
    expected_token = os.getenv("ALERT_INGEST_TOKEN")
    if not expected_token:
        raise HTTPException(status_code=503, detail="Alert ingestion is not configured")
    if not x_alert_ingest_token or not hmac.compare_digest(x_alert_ingest_token, expected_token):
        raise HTTPException(status_code=401, detail="Invalid alert ingestion token")
    if alert.location.region_key and alert.location.region_key not in REGION_DATA:
        raise HTTPException(status_code=422, detail="Unknown location region_key")

    record = alert.model_dump(mode="json")
    record["id"] = str(uuid4())
    record["received_at"] = datetime.now(timezone.utc).isoformat()
    await publish_alert(
        record,
        background_tasks,
        request.app.state.socket_server,
    )
    return record


@router.post("/api/simulator/alerts", status_code=201)
async def broadcast_simulator_alert(
    request: Request,
    payload: SimulatorAlertInput,
    background_tasks: BackgroundTasks,
    x_simulator_token: str | None = Header(default=None),
):
    expected_token = os.getenv("SIMULATOR_BROADCAST_TOKEN")
    if not expected_token:
        raise HTTPException(status_code=503, detail="Simulator broadcasts are not configured")
    if not x_simulator_token or not hmac.compare_digest(x_simulator_token, expected_token):
        raise HTTPException(status_code=401, detail="Invalid simulator access token")
    if payload.region_key not in REGION_DATA:
        raise HTTPException(status_code=422, detail="Unknown region_key")

    tier = payload.tier
    region = REGION_DATA[payload.region_key]
    values = {
        "YELLOW": {"severity": "moderate", "wind_speed_kmh": 76, "pressure_hpa": 1001, "storm_surge_meters": 0.8},
        "ORANGE": {"severity": "high", "wind_speed_kmh": 101, "pressure_hpa": 988, "storm_surge_meters": 1.5},
        "RED": {"severity": "critical", "wind_speed_kmh": 145, "pressure_hpa": 970, "storm_surge_meters": 2.8},
    }[tier]
    region_name = region["name"]
    message_description = (
        f"APADA-SETU SIMULATION EXERCISE, not a live or official warning. Zone: {tier}. "
        f"Area: {payload.ward}, {region_name}. Simulated conditions: "
        f"wind {values['wind_speed_kmh']} km/h, pressure {values['pressure_hpa']} hPa, "
        f"storm surge {values['storm_surge_meters']:.1f} m. This message is for testing only."
    )
    record = {
        "id": str(uuid4()),
        "hazard_type": "simulated_cyclone_risk",
        "severity": values["severity"],
        "title": f"SIMULATION: {tier} zone exercise · {payload.ward}",
        "description": message_description,
        "location": {
            "name": payload.ward,
            "region_key": payload.region_key,
            "latitude": (region["min_lat"] + region["max_lat"]) / 2,
            "longitude": (region["min_lon"] + region["max_lon"]) / 2,
        },
        "source": "simulator",
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "received_at": datetime.now(timezone.utc).isoformat(),
        "measurements": {**values, "tier": tier, "simulated": True},
        "is_simulation": True,
        "simulation_tier": tier,
    }
    await publish_alert(
        record,
        background_tasks,
        request.app.state.socket_server,
        notify_subscribers=False,
    )
    delivery_configured = get_configuration_status()["delivery_configured"]
    if payload.phone and delivery_configured:
        background_tasks.add_task(send_whatsapp_message, payload.phone, message_description)
    whatsapp_status = (
        "not_requested" if not payload.phone
        else "queued" if delivery_configured
        else "not_configured"
    )
    return {
        "alert": record,
        "whatsapp_preview": message_description,
        "channels": {
            "socket_io": "broadcasted",
            "whatsapp": whatsapp_status,
        },
    }
