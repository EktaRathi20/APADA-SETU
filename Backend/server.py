from collections import deque
from datetime import datetime, timezone
import hmac
import os
from typing import Any, Literal
from uuid import uuid4
import socketio
import ee
from google import genai
from google.genai import types
import json
from fastapi import BackgroundTasks, FastAPI, Header, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from ingestion_layer.population import fetch_population
from ingestion_layer.places import fetch_critical_infrastructure
from ingestion_layer.weather import fetch_7_day_forecast
from ingestion_layer.weather import fetch_meteorological_telemetry
from ingestion_layer.disaster_history import fetch_historical_disasters
from ingestion_layer.gee import init_gee
from ingestion_layer.constant import REGION_DATA
from ingestion_layer.index import run_ingestion
from ingestion_layer.disaster_intelligence import build_disaster_intelligence
from whatsapp import (
    InvalidVerification,
    VerificationRateLimit,
    WhatsAppNotConfigured,
    check_verification,
    get_configuration_status,
    send_alert_to_subscribers,
    send_welcome_message,
    send_whatsapp_message,
    start_verification,
)

# Initialize Gemini
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

api_app = FastAPI(
    title="APADA-SETU API",
    description="Backend API powering the Municipal Resilience & Disaster Digital Twin",
    version="1.0.0"
)

# CORS
api_app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000", 
        "http://127.0.0.1:5173",
        "*"                      
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Earth Engine once at server startup
@api_app.on_event("startup")
def startup_event():
    try:
        init_gee()
        print("Google Earth Engine initialized for API server.")
    except Exception as e:
        print(f"Earth Engine Initialization Warning: {e}")

# 3. Health check route
@api_app.get("/api/health")
def health_check():
    return {"status": "online", "service": "APADA-SETU Engine"}

# 4. Population API Route
@api_app.get("/api/population")
def get_population(region: str = Query("vizag", description="Region key (vizag, odisha, chennai, etc.)")):
    try:
        data = fetch_population(region_key=region)
        return data
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 5. Shelter API Route
@api_app.get("/api/shelter")
def get_shelter(region: str = Query("vizag", description="Region key (vizag, odisha, chennai, etc.)")):
    try:
        data = fetch_critical_infrastructure(region_key=region)
        return data
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 6. Current Conditions API Route
@api_app.get("/api/current-conditions")
def get_current_conditions(region: str = Query("vizag", description="Region key")):
    try:
        return fetch_meteorological_telemetry(region_key=region)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error))

# 7. Forecast API Route
@api_app.get("/api/forecast")
@api_app.get("/api/forcast", include_in_schema=False)
def get_forcast(region: str = Query("vizag", description="Region key (vizag, odisha, chennai, etc.)")):
    try:
        data = fetch_7_day_forecast(region_key=region)
        return data
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 8. Historical Disasters API Route
@api_app.get("/api/history")
def get_history(region: str = Query("vizag", description="Region key (vizag, odisha, chennai, etc.)")):
    try:
        data = fetch_historical_disasters(region_key=region)
        return data
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 9. Region Data API Route
@api_app.get("/api/region")
def get_region():
    try:
        return REGION_DATA
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 10. Alert Ingestion and Simulator Routes
class AlertLocation(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    region_key: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class ClimateAlertInput(BaseModel):
    hazard_type: str = Field(min_length=1, max_length=80)
    severity: Literal["critical", "high", "moderate", "low"]
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=2000)
    location: AlertLocation
    source: str = Field(min_length=1, max_length=120)
    observed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    measurements: dict[str, Any] = Field(default_factory=dict)


class SimulatorAlertInput(BaseModel):
    region_key: str = Field(min_length=1, max_length=80)
    tier: Literal["YELLOW", "ORANGE", "RED"]
    ward: str = Field(min_length=1, max_length=160)
    phone: str | None = Field(default=None, pattern=r"^\+[1-9]\d{7,14}$")


class WhatsAppVerificationStart(BaseModel):
    phone: str = Field(pattern=r"^\+[1-9]\d{7,14}$")


class WhatsAppVerificationCheck(BaseModel):
    phone: str = Field(pattern=r"^\+[1-9]\d{7,14}$")
    code: str = Field(pattern=r"^\d{4,10}$")
    action: Literal["subscribe", "unsubscribe"]


@api_app.get("/api/whatsapp/configuration")
def whatsapp_configuration():
    return get_configuration_status()


@api_app.post("/api/whatsapp/verification/start", status_code=202)
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


@api_app.post("/api/whatsapp/verification/check")
def check_whatsapp_verification(request: WhatsAppVerificationCheck, background_tasks: BackgroundTasks):
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
        return {"status": "approved", "action": request.action, "welcome_message": welcome_message}
    except InvalidVerification as error:
        raise HTTPException(status_code=400, detail=str(error))
    except WhatsAppNotConfigured as error:
        raise HTTPException(status_code=503, detail=str(error))
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error))

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*"
)

alerts: deque[dict[str, Any]] = deque(maxlen=500)
automatic_alert_fingerprints: deque[str] = deque(maxlen=500)


async def emit_risk_assessment_alert(region_key: str, result: dict[str, Any], background_tasks: BackgroundTasks):
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
            f"This is not an official warning or evacuation order. Factors: "
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
    await sio.emit("climate_alert", record)
    if get_configuration_status()["delivery_configured"]:
        background_tasks.add_task(send_alert_to_subscribers, record)


@api_app.get("/api/alerts")
def list_alerts(limit: int = Query(100, ge=1, le=500)):
    return [alert for alert in alerts if not alert.get("is_simulation")][:limit]


@api_app.post("/api/alerts", status_code=201)
async def ingest_alert(
    alert: ClimateAlertInput,
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
    alerts.appendleft(record)
    await sio.emit("climate_alert", record)
    if get_configuration_status()["delivery_configured"]:
        background_tasks.add_task(send_alert_to_subscribers, record)
    return record


@api_app.post("/api/simulator/alerts", status_code=201)
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
    alerts.appendleft(record)
    await sio.emit("climate_alert", record)
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

@api_app.get("/api/disaster-intelligence/{region}")
async def get_disaster_intelligence(region: str, background_tasks: BackgroundTasks):
    result = await build_disaster_intelligence(region, client)
    await emit_risk_assessment_alert(result.get("region", region.strip().lower()), result, background_tasks)
    return result


class DispatchChatRequest(BaseModel):
    query: str
    region: str = "vizag"
    current_location: str = "Unknown" 

@api_app.post("/api/dispatch-chat")
async def process_dispatch_chat(request: DispatchChatRequest):
    # 1. LOAD THE LIVE REAL-WORLD INFRASTRUCTURE DATA
    places_data = []
    try:
        # Call the function directly for live, updated data instead of reading a file
        unified_data = run_ingestion(request.region)
        places_data = unified_data.get("shelter", [])
    except Exception as e:
        print(f"Warning: Could not fetch live ingested data - {e}")

    # 2. FEED REAL DATA INTO GEMINI
    prompt = f"""
    You are ClimaGuard Verified Dispatch, an AI tactical routing assistant for {request.region}.
    
    The user entered the command: "{request.query}"
    
    REAL-WORLD CRITICAL INFRASTRUCTURE DATA:
    {json.dumps(places_data, indent=2) if places_data else "No live data available."}
    
    INSTRUCTIONS:
    1. Extract the user's current location from their command (e.g., after 'loc -' or 'from -').
    2. Identify what they need (e.g., Shelter, Hospital).
    3. SEARCH the provided 'REAL-WORLD CRITICAL INFRASTRUCTURE DATA' and select the most relevant, ACTUAL place. Do not invent names.
    4. Generate a tactical route from their location to the selected facility.
    
    You MUST output ONLY valid JSON matching this exact structure:
    {{
        "text": "Briefly list 2-3 real nearby facilities found in the data, then state which one you are routing them to.",
        "verifiedRoute": {{
            "origin": "User's extracted location",
            "destination": "EXACT name of the facility from the JSON data",
            "clearanceStatus": "VERIFIED_CLEAR, CAUTION_RESTRICTED, or IMPASSABLE_FLOOD",
            "waterDepth": "e.g., '0.45m max (Coastal stretch)'",
            "recommendedPath": "Clear, tactical driving instructions.",
            "waypoints": ["Point 1", "Point 2", "Point 3"],
            "sensorVerification": "e.g., 'GloFAS Bridge Anemometer'",
            "validityWindow": "e.g., 'Valid for next 45 minutes'"
        }}
    }}
    """

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2, 
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Chat API Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate route clearance")

app = socketio.ASGIApp(sio, other_asgi_app=api_app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
