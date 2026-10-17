import ee
from datetime import datetime, timedelta
from ingestion_layer.cache import load_json_cache, save_json_cache
from ingestion_layer.constant import get_region_coords

POPULATION_CACHE_TTL = timedelta(hours=24)


def _load_recent_population(region_key):
    return load_json_cache(
        f"population_{region_key}.json",
        POPULATION_CACHE_TTL,
        region_key=region_key,
        validator=lambda data: (
            isinstance(data, dict)
            and not data.get("source_error")
            and isinstance(data.get("total_population"), (int, float))
            and data["total_population"] > 0
        ),
    )


def _save_population(region_key, population_data):
    if population_data.get("source_error") or population_data.get("total_population") is None:
        return

    save_json_cache(f"population_{region_key}.json", population_data)


def fetch_population(region_key="vizag"):
    cached_data = _load_recent_population(region_key)
    if cached_data is not None:
        return cached_data

    coords = get_region_coords(region_key)

    try:
        center_point = ee.Geometry.Point([coords["lon"], coords["lat"]])
        aoi = center_point.buffer(10000).bounds()

        worldpop = (
            ee.ImageCollection("WorldPop/GP/100m/pop")
            .filterDate("2020-01-01", "2021-01-01")
            .filterBounds(aoi)
            .select("population")
            .mosaic()
        )

        pop_reduction = worldpop.reduceRegion(
            reducer=ee.Reducer.sum(),
            geometry=aoi,
            scale=100,
            maxPixels=1e9,
        ).getInfo()

        raw_population = pop_reduction.get("population")
        if raw_population is None or raw_population <= 0:
            return {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "region_target": region_key,
                "total_population": None,
                "source_error": "WorldPop returned no population pixels for this area.",
            }
        
        population_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "region_target": region_key,
            "total_population": int(raw_population),
        }
        _save_population(region_key, population_data)
        return population_data

    except Exception as e:
        print(f"⚠️ [POPULATION] Error: {e}.")
        return {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "region_target": region_key,
            "total_population": None,
            "source_error": str(e),
        }