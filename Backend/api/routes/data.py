from typing import Literal

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
def get_history(
    region: str = Query("vizag", description="Region key (vizag, odisha, chennai, etc.)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    search: str = Query("", max_length=120),
    sort_by: Literal["newest", "oldest", "wind", "distance"] = "newest",
):
    try:
        result = fetch_historical_disasters(region_key=region)
        events = list(result["historical_analogs"])
        total_events = len(events)
        normalized_search = search.strip().casefold()
        if normalized_search:
            events = [
                event
                for event in events
                if normalized_search
                in f"{event['matched_cyclone']} {event['reference_period']['start_date']}".casefold()
            ]

        if sort_by == "wind":
            events.sort(
                key=lambda event: (
                    event["historical_peak_wind_kmh"] is not None,
                    event["historical_peak_wind_kmh"]
                    if event["historical_peak_wind_kmh"] is not None
                    else -1,
                ),
                reverse=True,
            )
        elif sort_by == "distance":
            events.sort(key=lambda event: event["closest_approach_km"])
        else:
            events.sort(
                key=lambda event: event["reference_period"]["start_date"],
                reverse=sort_by == "newest",
            )

        matching_events = len(events)
        start = (page - 1) * page_size
        result["historical_analogs"] = events[start : start + page_size]
        result["page"] = page
        result["page_size"] = page_size
        result["total_events"] = total_events
        result["matching_events"] = matching_events
        result["total_pages"] = (matching_events + page_size - 1) // page_size
        return result
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
