import codecs
import csv
from datetime import datetime, timedelta, timezone
import math
import threading
import time

import requests

from ingestion_layer.cache import load_json_cache, save_json_cache
from ingestion_layer.constant import HISTORY_SEARCH_RADIUS_KM, REGION_COORDS, get_region_coords

IBTRACS_CSV_URL = "https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/ibtracs.NI.list.v04r01.csv"
CACHE_TTL_SECONDS = 6 * 60 * 60
CACHE_FILENAME = "historical_tracks_cache.json"
_cache_lock = threading.Lock()
_cache_loaded_at = 0.0
_cache_events_by_region = None


def _distance_km(latitude_a, longitude_a, latitude_b, longitude_b):
    earth_radius_km = 6371.0
    latitude_delta = math.radians(latitude_b - latitude_a)
    longitude_delta = math.radians(longitude_b - longitude_a)
    haversine = (
        math.sin(latitude_delta / 2) ** 2
        + math.cos(math.radians(latitude_a))
        * math.cos(math.radians(latitude_b))
        * math.sin(longitude_delta / 2) ** 2
    )
    return 2 * earth_radius_km * math.asin(math.sqrt(haversine))


def _number(value):
    try:
        parsed = float(value)
        return parsed if parsed >= 0 else None
    except (TypeError, ValueError):
        return None


def _download_tracks_by_region():
    events_by_region = {region_key: {} for region_key in REGION_COORDS}
    first_season = datetime.now(timezone.utc).year - 30

    try:
        with requests.get(IBTRACS_CSV_URL, stream=True, timeout=(15, 120)) as response:
            response.raise_for_status()
            lines = codecs.iterdecode(response.iter_lines(), "utf-8-sig")
            reader = csv.DictReader(lines)
            next(reader, None)

            for row in reader:
                try:
                    season = int(row.get("SEASON", ""))
                    latitude = float(row.get("LAT", ""))
                    longitude = float(row.get("LON", ""))
                    observed_at = datetime.strptime(row.get("ISO_TIME", "")[:10], "%Y-%m-%d").date()
                except (TypeError, ValueError):
                    continue

                if season < first_season:
                    continue

                name = (row.get("NAME") or "UNNAMED").strip()
                storm_id = row.get("SID") or f"{season}:{name}"
                wind_knots = _number(row.get("WMO_WIND"))
                if wind_knots is None:
                    wind_knots = _number(row.get("USA_WIND"))
                wind_kmh = round(wind_knots * 1.852) if wind_knots is not None else None

                for region_key, coordinates in REGION_COORDS.items():
                    distance = _distance_km(
                        coordinates["lat"], coordinates["lon"], latitude, longitude
                    )
                    radius = HISTORY_SEARCH_RADIUS_KM.get(region_key, 250)
                    if distance > radius:
                        continue

                    storm = events_by_region[region_key].setdefault(storm_id, {
                        "matched_cyclone": f"{name} ({season})",
                        "historical_peak_wind_kmh": None,
                        "historical_surge_meters": None,
                        "closest_approach_km": round(distance, 1),
                        "reference_period": {
                            "start_date": observed_at.isoformat(),
                            "end_date": observed_at.isoformat(),
                        },
                        "source": "NOAA IBTrACS v04r01",
                    })
                    storm["reference_period"]["start_date"] = min(
                        storm["reference_period"]["start_date"], observed_at.isoformat()
                    )
                    storm["reference_period"]["end_date"] = max(
                        storm["reference_period"]["end_date"], observed_at.isoformat()
                    )
                    storm["closest_approach_km"] = min(storm["closest_approach_km"], round(distance, 1))
                    if wind_kmh is not None and (
                        storm["historical_peak_wind_kmh"] is None
                        or wind_kmh > storm["historical_peak_wind_kmh"]
                    ):
                        storm["historical_peak_wind_kmh"] = wind_kmh
    except requests.RequestException as error:
        raise RuntimeError(f"Could not retrieve NOAA IBTrACS history: {error}") from error

    return {
        region_key: sorted(
            region_events.values(),
            key=lambda event: event["reference_period"]["start_date"],
            reverse=True,
        )
        for region_key, region_events in events_by_region.items()
    }


def _get_cached_tracks():
    global _cache_loaded_at, _cache_events_by_region
    if _cache_events_by_region is not None and time.monotonic() - _cache_loaded_at < CACHE_TTL_SECONDS:
        return _cache_events_by_region

    with _cache_lock:
        if _cache_events_by_region is None or time.monotonic() - _cache_loaded_at >= CACHE_TTL_SECONDS:
            cached_tracks = load_json_cache(
                CACHE_FILENAME,
                timedelta(seconds=CACHE_TTL_SECONDS),
                payload_key="events_by_region",
                validator=lambda events_by_region: (
                    isinstance(events_by_region, dict)
                    and all(
                        isinstance(events_by_region.get(region_key), list)
                        for region_key in REGION_COORDS
                    )
                ),
            )

            if cached_tracks is not None:
                _cache_events_by_region = cached_tracks
            else:
                _cache_events_by_region = _download_tracks_by_region()
                save_json_cache(
                    CACHE_FILENAME,
                    _cache_events_by_region,
                    payload_key="events_by_region",
                )
            _cache_loaded_at = time.monotonic()
    return _cache_events_by_region


def fetch_historical_disasters(region_key="vizag"):
    get_region_coords(region_key)
    events = _get_cached_tracks()[region_key]
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "region_target": region_key,
        "source": "NOAA IBTrACS North Indian Ocean v04r01",
        "source_url": IBTRACS_CSV_URL,
        "total_historical_events_analyzed": len(events),
        "historical_analogs": events,
    }