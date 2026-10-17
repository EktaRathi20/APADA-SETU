from collections import deque
from datetime import datetime, timezone
import hmac
import os
from typing import Any, Literal
from uuid import uuid4

from fastapi import BackgroundTasks, FastAPI, Header, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import socketio
import ee
from ingestion_layer.population import fetch_population
from ingestion_layer.places import fetch_critical_infrastructure
from ingestion_layer.weather import fetch_7_day_forecast
from ingestion_layer.weather import fetch_meteorological_telemetry
from ingestion_layer.disaster_history import fetch_historical_disasters
from ingestion_layer.gee import init_gee
from ingestion_layer.constant import REGION_DATA
from whatsapp import (
    InvalidVerification,
    VerificationRateLimit,
    WhatsAppNotConfigured,
    check_verification,
    get_configuration_status,
    send_alert_to_subscribers,
    start_verification,
)

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
def check_whatsapp_verification(request: WhatsAppVerificationCheck):
    try:
        check_verification(request.phone, request.code, request.action)
        return {"status": "approved", "action": request.action}
    except InvalidVerification as error:
        raise HTTPException(status_code=400, detail=str(error))
    except WhatsAppNotConfigured as error:
        raise HTTPException(status_code=503, detail=str(error))
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error))


sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
)
alerts: deque[dict[str, Any]] = deque(maxlen=500)


@api_app.get("/api/alerts")
def list_alerts(limit: int = Query(100, ge=1, le=500)):
    return list(alerts)[:limit]


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


app = socketio.ASGIApp(sio, other_asgi_app=api_app)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
