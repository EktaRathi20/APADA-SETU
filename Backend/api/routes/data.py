from fastapi import APIRouter, HTTPException, Query

from ingestion_layer.constant import REGION_DATA
from ingestion_layer.disaster_history import fetch_historical_disasters
from ingestion_layer.places import fetch_critical_infrastructure
from ingestion_layer.population import fetch_population
from ingestion_layer.weather import fetch_7_day_forecast, fetch_meteorological_telemetry


router = APIRouter()


@router.get("/api/health")
def health_check():
    return {"status": "online", "service": "APADA-SETU Engine"}


@router.get("/api/population")
def get_population(region: str = Query("vizag", description="Region key (vizag, odisha, chennai, etc.)")):
    try:
        return fetch_population(region_key=region)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/api/shelter")
def get_shelter(region: str = Query("vizag", description="Region key (vizag, odisha, chennai, etc.)")):
    try:
        return fetch_critical_infrastructure(region_key=region)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/api/current-conditions")
def get_current_conditions(region: str = Query("vizag", description="Region key")):
    try:
        return fetch_meteorological_telemetry(region_key=region)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error))


@router.get("/api/forecast")
@router.get("/api/forcast", include_in_schema=False)
def get_forecast(region: str = Query("vizag", description="Region key (vizag, odisha, chennai, etc.)")):
    try:
        return fetch_7_day_forecast(region_key=region)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/api/history")
def get_history(region: str = Query("vizag", description="Region key (vizag, odisha, chennai, etc.)")):
    try:
        return fetch_historical_disasters(region_key=region)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/api/region")
def get_region():
    try:
        return REGION_DATA
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
