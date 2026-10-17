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
    title="CIIVF Digital Twin API",
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
    return {"status": "online", "service": "CIIVF Engine"}

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

@api_app.get("/api/shelter")
def get_shelter(region: str = Query("vizag", description="Region key (vizag, odisha, chennai, etc.)")):
    try:
        data = fetch_critical_infrastructure(region_key=region)
        return data
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_app.get("/api/current-conditions")
def get_current_conditions(region: str = Query("vizag", description="Region key")):
    try:
        return fetch_meteorological_telemetry(region_key=region)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error))

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

@api_app.get("/api/region")
def get_region():
    try:
        return REGION_DATA
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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


# sio = socketio.AsyncServer(
#     async_mode="asgi",
#     cors_allowed_origins=[
#         "http://localhost:3000",
#         "http://127.0.0.1:3000",
#         "http://localhost:3001",
#         "http://127.0.0.1:3001",
#         "http://localhost:5173",
#         "http://127.0.0.1:5173",
#         "https://mellifluous-kitten-6f39a8.netlify.app",
#     ],
# )

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*" # Set to "*" temporarily to test if it's a CORS issue
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
            f"CIIVF screening detected {risk_level} risk (score {assessment.get('score', 0)}). "
            f"This is not an official warning or evacuation order. Factors: "
            f"{'; '.join(str(factor) for factor in factors) or 'elevated current conditions'}."
        ),
        "location": {
            "name": region.get("name", region_key),
            "region_key": region_key,
            "latitude": (region.get("min_lat", 0) + region.get("max_lat", 0)) / 2,
            "longitude": (region.get("min_lon", 0) + region.get("max_lon", 0)) / 2,
        },
        "source": "CIIVF deterministic risk screening",
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
        f"CIIVF SIMULATION EXERCISE, not a live or official warning. Zone: {tier}. "
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

# @api_app.get("/api/disaster-intelligence/{region}")
# async def get_disaster_intelligence(region: str):
#     try:
#         unified_data = run_ingestion(region)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Data Ingestion Error: {str(e)}")

#     telemetry = unified_data.get("meteorological_telemetry") or unified_data.get("current_condition") or {}
#     metrics = telemetry.get("metrics") if isinstance(telemetry, dict) else {}
#     wind = telemetry.get("wind_speed_kmh")
#     if wind is None and isinstance(metrics, dict):
#         wind = metrics.get("peak_wind_kmh") or 0
#     pressure = telemetry.get("pressure_hpa")
#     if pressure is None and isinstance(metrics, dict):
#         pressure = metrics.get("central_pressure_hpa") or 1013
#     surge_depth_meters = telemetry.get("storm_surge_meters")
#     if surge_depth_meters is None and isinstance(metrics, dict):
#         surge_depth_meters = metrics.get("storm_surge_meters") or 0.5

#     if wind is None:
#         wind = 0
#     if pressure is None:
#         pressure = 1013
#     if surge_depth_meters is None:
#         surge_depth_meters = 0.5

#     surge_depth_meters = float(surge_depth_meters)
#     if surge_depth_meters < 0.4:
#         surge_depth_meters = max(0.4, ((float(wind) - 40) / 100) * 1.8 + (1013 - float(pressure)) * 0.02)
#     parametric_unlocked = surge_depth_meters >= 1.2

#     region_meta = unified_data.get("region_metadata") or {}
#     center_lat = ((region_meta.get("min_lat") or 0) + (region_meta.get("max_lat") or 0)) / 2 if region_meta else 0
#     center_lon = ((region_meta.get("min_lon") or 0) + (region_meta.get("max_lon") or 0)) / 2 if region_meta else 0

#     risk_zones = [
#         {
#             "id": "red-zone",
#             "label": "Red Zone",
#             "color": "red",
#             "lat": center_lat + 0.025,
#             "lon": center_lon + 0.02,
#             "radius_km": 7.5,
#             "description": "Immediate evacuation and shelter activation zone"
#         },
#         {
#             "id": "yellow-zone",
#             "label": "Yellow Zone",
#             "color": "yellow",
#             "lat": center_lat + 0.065,
#             "lon": center_lon + 0.055,
#             "radius_km": 15,
#             "description": "Standby and staging zone for logistics and equipment"
#         }
#     ]

#     top_analogs = unified_data.get("history", {}).get("historical_analogs", []) if isinstance(unified_data.get("history"), dict) else []
#     if not top_analogs and isinstance(unified_data.get("history"), dict):
#         top_analogs = [unified_data["history"]]

#     prompt = f"""
#     You are the intelligence core of ClimaGuard, an expert disaster management digital twin aligned with NDMA guidelines.

#     Current Telemetry:
#     - Region: {region}
#     - Wind Speed: {wind} km/h
#     - Atmospheric Pressure: {pressure} hPa
#     - Predicted Storm Surge: {surge_depth_meters} meters

#     Contextual Data (Shelters, Demographics, Historical Analogs):
#     {json.dumps(unified_data, indent=2)}

#     Based on this data, produce ONLY valid JSON with these exact keys:
#     {
#       "primary_analog": "Name of the closest historical cyclone or event",
#       "risk_zones": [
#         {"id": "red-zone", "label": "Red Zone", "color": "red", "lat": 17.68, "lon": 83.20, "radius_km": 7.5, "description": "Immediate evacuation zone"},
#         {"id": "yellow-zone", "label": "Yellow Zone", "color": "yellow", "lat": 17.73, "lon": 83.28, "radius_km": 15, "description": "Standby zone"}
#       ],
#       "recommended_tasks": [
#         {"department": "Municipal Disaster Cell", "location": "Ward 17 and nearest coastline", "description": "Pre-position pumps and suspend low-lying movement", "sub_team": "Field Response Team 1", "status_text": "Start ->"}
#       ],
#       "insurance_summary": {
#         "trigger_met": true,
#         "trigger_threshold_m": 1.2,
#         "observed_water_depth_m": 1.42,
#         "estimated_payout_cr": 14.5,
#         "headline": "Parametric insurance payout unlocked",
#         "coverage_focus": ["Coastal wards", "low-lying settlements"]
#       }
#     }
#     """

#     try:
#         if client is not None:
#             response = client.models.generate_content(
#                 model="gemini-2.5-flash",
#                 contents=prompt,
#                 config=types.GenerateContentConfig(
#                     response_mime_type="application/json",
#                     temperature=0.1,
#                 ),
#             )
#             tactical_insights = json.loads(response.text)
#         else:
#             raise RuntimeError("GEMINI_API_KEY is not configured")
#     except Exception as e:
#         print(f"Gemini Parsing Error: {e}")
#         tactical_insights = {
#             "primary_analog": top_analogs[0].get("matched_cyclone") if top_analogs and isinstance(top_analogs[0], dict) else "Historical analog unavailable",
#             "risk_zones": risk_zones,
#             "recommended_tasks": [
#                 {
#                     "department": "Municipal Disaster Cell",
#                     "location": "Coastal wetlands and low-lying settlements",
#                     "description": "Pre-position pumps, activate shelters, and restrict low-lying movement.",
#                     "sub_team": "Field Response Team 1",
#                     "status_text": "Start ->"
#                 }
#             ],
#             "insurance_summary": {
#                 "trigger_met": parametric_unlocked,
#                 "trigger_threshold_m": 1.2,
#                 "observed_water_depth_m": round(surge_depth_meters, 2),
#                 "estimated_payout_cr": 14.50 if parametric_unlocked else 0.0,
#                 "headline": "Parametric insurance payout unlocked" if parametric_unlocked else "Trigger not reached",
#                 "coverage_focus": ["Coastal wards", "critical shelters", "low-lying settlements"]
#             }
#         }

#     if isinstance(tactical_insights.get("risk_zones"), list):
#         for idx, zone in enumerate(tactical_insights["risk_zones"][:2]):
#             if isinstance(zone, dict):
#                 zone.setdefault("id", f"zone-{idx + 1}")
#                 zone.setdefault("label", "Risk Zone")
#                 zone.setdefault("color", "red" if idx == 0 else "yellow")
#                 zone.setdefault("lat", center_lat + (0.02 if idx == 0 else 0.07))
#                 zone.setdefault("lon", center_lon + (0.02 if idx == 0 else 0.06))
#                 zone.setdefault("radius_km", 7.5 if idx == 0 else 15)
#                 zone.setdefault("description", "Alert zone")
#     else:
#         tactical_insights["risk_zones"] = risk_zones

#     if not isinstance(tactical_insights.get("insurance_summary"), dict):
#         tactical_insights["insurance_summary"] = {
#             "trigger_met": parametric_unlocked,
#             "trigger_threshold_m": 1.2,
#             "observed_water_depth_m": round(surge_depth_meters, 2),
#             "estimated_payout_cr": 14.50 if parametric_unlocked else 0.0,
#             "headline": "Parametric insurance payout unlocked" if parametric_unlocked else "Trigger not reached",
#             "coverage_focus": ["Coastal wards", "critical shelters", "low-lying settlements"]
#         }

#     return {
#         "status": "success",
#         "region": region,
#         "telemetry": unified_data,
#         "ml_prediction": {
#             "surge_depth_meters": round(surge_depth_meters, 2),
#             "trigger_parametric_relief": parametric_unlocked,
#             "disbursement_amount_cr": 14.50 if parametric_unlocked else 0.0
#         },
#         "tactical_insights": tactical_insights
#     }
# app = socketio.ASGIApp(sio, other_asgi_app=api_app)@api_app.get("/api/disaster-intelligence/{region}")
# async def get_disaster_intelligence(region: str):
#     # 1. RUN INGESTION SCRIPT
#     try:
#         # Calls your existing function to hit GEE, IMD, WorldPop, and NOAA
#         unified_data = run_ingestion(region)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Data Ingestion Error: {str(e)}")

#     # 2. EXTRACT ML FEATURES
#     wind = unified_data["current_condition"].get("wind_speed_kmh", 0)
#     pressure = unified_data["current_condition"].get("pressure_hpa", 1013)

#     # 3. MOCKED SURGE PREDICTION (Replacing Vertex AI)
#     # Realistic empirical surge estimate formula for the hackathon demo
#     surge_depth_meters = round(max(0.4, ((wind - 40) / 100) * 1.8 + (1013 - pressure) * 0.02), 2)

#     # 4. PARAMETRIC RELIEF TRIGGER (Phase 5)
#     parametric_unlocked = surge_depth_meters >= 1.2

#     # 5. GEMINI 2.5 TACTICAL INSIGHTS (Phase 3)
#     top_analogs = unified_data.get('disaster_history', {}).get('historical_analogs', [])[:3]
    
#     prompt = f"""
#     You are the intelligence core of ClimaGuard, an expert disaster management digital twin aligned with NDMA guidelines. 
    
#     Current Telemetry:
#     - Region: {region}
#     - Wind Speed: {wind} km/h
#     - Atmospheric Pressure: {pressure} hPa
#     - Predicted Storm Surge: {surge_depth_meters} meters
    
#     Contextual Data (Shelters, Demographics, Historical Analogs):
#     {json.dumps(unified_data, indent=2)}
    
#     Based on the predicted surge, wind speed, and historical analogs, analyze the vulnerability of the region. Your job is to recommend urgent tactical tasks that need to be assigned to municipal response teams.
    
#     You MUST output ONLY valid JSON without any markdown formatting, backticks, or extra text. The JSON must exactly match this structure:
    
#     {{
#       "primary_analog": "Name of the most similar past cyclone from the data",
#       "risk_zones": {{
#         "red_zone": ["List of 2-3 specific high-risk wards or coastal areas requiring immediate CAP evacuation"],
#         "yellow_zone": ["List of 2-3 specific moderate-risk adjacent areas for standby alerts"]
#       }},
#       "recommended_tasks": [
#         {{
#           "department": "e.g., PWD Water Supply",
#           "location": "e.g., Ward 17 & Topsia",
#           "description": "e.g., Pre-position 22 High-Capacity De-watering Diesel Pumps",
#           "sub_team": "e.g., Pumps Div Team 3",
#           "status_text": "Start ->"
#         }}
#         // Generate 3 to 4 highly specific, realistic municipal tasks based on the telemetry
#       ]
#     }}
#     """
    
#     try:
#         response = client.models.generate_content(
#             model="gemini-3.5-flash-lite",
#             contents=prompt,
#             config=types.GenerateContentConfig(
#                 response_mime_type="application/json",
#                 temperature=0.1,
#             ),
#         )
#         tactical_insights = json.loads(response.text)
#     except Exception as e:
#         print(f"Gemini Parsing Error: {e}")
#         tactical_insights = {
#             "primary_analog": "Data unavailable",
#             "vulnerable_infrastructure": ["Coastal Embankments", "Power Grid Substations"],
#             "recommended_action": "Initiate immediate CAP evacuation and pre-position high-capacity pumps."
#         }

#     # 6. RETURN FINAL PAYLOAD TO FRONTEND
#     return {
#         "status": "success",
#         "region": region,
#         "telemetry": unified_data,
#         "ml_prediction": {
#             "surge_depth_meters": surge_depth_meters,
#             "trigger_parametric_relief": parametric_unlocked,
#             "disbursement_amount_cr": 14.50 if parametric_unlocked else 0.0
#         },
#         "tactical_insights": tactical_insights
#     }

@api_app.get("/api/disaster-intelligence/{region}")
async def get_disaster_intelligence(region: str, background_tasks: BackgroundTasks):
    result = await build_disaster_intelligence(region, client)
    await emit_risk_assessment_alert(result.get("region", region.strip().lower()), result, background_tasks)
    return result

#------------------NEW CODE---------------#
# client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

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
