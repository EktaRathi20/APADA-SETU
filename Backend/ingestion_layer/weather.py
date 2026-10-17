import os
import requests
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from ingestion_layer.cache import load_json_cache, save_json_cache
from ingestion_layer.constant import get_region_coords

load_dotenv()

TELEMETRY_CACHE_TTL = timedelta(minutes=10)
FORECAST_CACHE_TTL = timedelta(hours=6)


def _description_text(description):
    if isinstance(description, dict):
        return description.get("text") or "Unknown"
    return description if isinstance(description, str) and description else "Unknown"


def _weather_code_description(code):
    if code == 0:
        return "Clear sky"
    if code == 1:
        return "Mainly clear"
    if code == 2:
        return "Partly cloudy"
    if code == 3:
        return "Overcast"
    if code in (45, 48):
        return "Fog"
    if code in (51, 53, 55, 56, 57):
        return "Drizzle"
    if code in (61, 63, 65, 66, 67):
        return "Rain"
    if code in (71, 73, 75, 77, 85, 86):
        return "Snow"
    if code in (80, 81, 82):
        return "Rain showers"
    if code in (95, 96, 99):
        return "Thunderstorm"
    return "Unknown"


def _wind_direction(degrees):
    if degrees is None:
        return None
    directions = ("N", "NE", "E", "SE", "S", "SW", "W", "NW")
    return directions[round(float(degrees) / 45) % len(directions)]


def _open_meteo_request(latitude, longitude, **params):
    response = requests.get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": latitude,
            "longitude": longitude,
            "timezone": "UTC",
            **params,
        },
        timeout=15,
    )
    if not response.ok:
        raise RuntimeError(f"Open-Meteo returned HTTP {response.status_code}: {response.reason}")
    return response.json()


def _provider_error(response):
    try:
        message = response.json().get("error", {}).get("message")
    except (ValueError, AttributeError):
        message = None
    return f"Google Weather API returned HTTP {response.status_code}: {message or response.reason}"


def _fallback_current_conditions(region_key, coords, primary_error):
    try:
        weather_data = _open_meteo_request(
            coords["lat"],
            coords["lon"],
            current=(
                "temperature_2m,relative_humidity_2m,weather_code,"
                "wind_speed_10m,wind_direction_10m,pressure_msl"
            ),
        )
        current = weather_data.get("current", {})
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "region_target": region_key,
            "temperature_c": current.get("temperature_2m"),
            "condition": _weather_code_description(current.get("weather_code")),
            "wind_speed_kmh": current.get("wind_speed_10m"),
            "wind_direction": _wind_direction(current.get("wind_direction_10m")),
            "pressure_hpa": current.get("pressure_msl"),
            "relative_humidity_percent": current.get("relative_humidity_2m"),
            "system_name": "Open-Meteo",
            "source": "Open-Meteo",
            "source_fallback": True,
        }
    except (requests.RequestException, RuntimeError, ValueError, TypeError) as error:
        raise RuntimeError(f"{primary_error}; Open-Meteo fallback failed: {error}") from error


def _fallback_forecast(region_key, coords, primary_error):
    try:
        weather_data = _open_meteo_request(
            coords["lat"],
            coords["lon"],
            forecast_days=7,
            daily="weather_code,temperature_2m_max,temperature_2m_min",
        )
        daily = weather_data.get("daily", {})
        times = daily.get("time", [])
        highs = daily.get("temperature_2m_max", [])
        lows = daily.get("temperature_2m_min", [])
        codes = daily.get("weather_code", [])
        forecast = [
            {
                "date": date,
                "max_temp_c": highs[index] if index < len(highs) else None,
                "min_temp_c": lows[index] if index < len(lows) else None,
                "condition": _weather_code_description(codes[index]) if index < len(codes) else "Unknown",
            }
            for index, date in enumerate(times[:7])
        ]
        return {
            "region_target": region_key,
            "latitude": coords["lat"],
            "longitude": coords["lon"],
            "forecast": forecast,
            "source": "Open-Meteo",
            "source_fallback": True,
        }
    except (requests.RequestException, RuntimeError, ValueError, TypeError) as error:
        raise RuntimeError(f"{primary_error}; Open-Meteo fallback failed: {error}") from error


def fetch_meteorological_telemetry(region_key="vizag"):
    cache_filename = f"telemetry_{region_key}.json"
    cached_data = load_json_cache(
        cache_filename, TELEMETRY_CACHE_TTL, region_key=region_key
    )
    if cached_data is not None:
        return cached_data

    google_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    coords = get_region_coords(region_key)
    if not google_api_key:
        weather_data = _fallback_current_conditions(
            region_key,
            coords,
            "GOOGLE_MAPS_API_KEY is not configured",
        )
        save_json_cache(cache_filename, weather_data)
        return weather_data

    url = f"https://weather.googleapis.com/v1/currentConditions:lookup?key={google_api_key}&location.latitude={coords['lat']}&location.longitude={coords['lon']}"
    try:
        response = requests.get(url, timeout=15)
    except requests.RequestException as error:
        weather_data = _fallback_current_conditions(
            region_key,
            coords,
            f"Google Weather API request failed: {error}",
        )
        save_json_cache(cache_filename, weather_data)
        return weather_data
    if response.status_code != 200:
        weather_data = _fallback_current_conditions(region_key, coords, _provider_error(response))
        save_json_cache(cache_filename, weather_data)
        return weather_data

    weather_data = response.json()
    temperature = weather_data.get("temperature", {})
    condition = weather_data.get("weatherCondition", {}).get("description", {})
    wind = weather_data.get("wind", {}).get("speed", {})
    wind_speed = wind.get("value")
    wind_unit = wind.get("unit", "KILOMETERS_PER_HOUR")
    if wind_speed is not None and wind_unit == "METERS_PER_SECOND":
        wind_speed *= 3.6

    weather_data = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "region_target": region_key,
        "temperature_c": temperature.get("degrees"),
        "condition": condition.get("text") if isinstance(condition, dict) else condition,
        "wind_speed_kmh": round(wind_speed, 1) if wind_speed is not None else None,
        "wind_direction": weather_data.get("wind", {}).get("direction", {}).get("cardinal"),
        "pressure_hpa": weather_data.get("airPressure", {}).get("meanSeaLevelMillibars"),
        "relative_humidity_percent": weather_data.get("relativeHumidity"),
        "system_name": "Google Weather API",
        "source": "Google Weather API",
        "source_fallback": False,
    }
    save_json_cache(cache_filename, weather_data)
    return weather_data


def fetch_7_day_forecast(region_key="vizag"):
    cache_filename = f"forecast_{region_key}.json"
    cached_data = load_json_cache(
        cache_filename,
        FORECAST_CACHE_TTL,
        payload_key="data",
        region_key=region_key,
    )
    if cached_data is not None:
        return cached_data

    google_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    coords = get_region_coords(region_key)
    if not google_api_key:
        forecast_data = _fallback_forecast(region_key, coords, "GOOGLE_MAPS_API_KEY is not configured")
        save_json_cache(
            cache_filename,
            forecast_data,
            payload_key="data",
            metadata={"region_target": region_key},
        )
        return forecast_data

    url = f"https://weather.googleapis.com/v1/forecast/days:lookup?key={google_api_key}&location.latitude={coords['lat']}&location.longitude={coords['lon']}&days=7"
    try:
        response = requests.get(url, timeout=20)
    except requests.RequestException as error:
        forecast_data = _fallback_forecast(region_key, coords, f"Google Weather API request failed: {error}")
        save_json_cache(
            cache_filename,
            forecast_data,
            payload_key="data",
            metadata={"region_target": region_key},
        )
        return forecast_data
    if response.status_code != 200:
        forecast_data = _fallback_forecast(region_key, coords, _provider_error(response))
        save_json_cache(
            cache_filename,
            forecast_data,
            payload_key="data",
            metadata={"region_target": region_key},
        )
        return forecast_data

    weather_data = response.json()
    forecast_days = weather_data.get("forecastDays", [])
    processed_forecast = []
    for day in forecast_days:
        date_info = day.get("displayDate", {})
        date_str = f"{date_info.get('year')}-{str(date_info.get('month', 0)).zfill(2)}-{str(date_info.get('day', 0)).zfill(2)}"
        max_temp = day.get("maxTemperature", {}).get("degrees")
        min_temp = day.get("minTemperature", {}).get("degrees")
        day_condition = day.get("daytimeForecast", {}).get("weatherCondition", {})
        condition_desc = _description_text(day_condition.get("description"))
        processed_forecast.append({
            "date": date_str,
            "max_temp_c": max_temp,
            "min_temp_c": min_temp,
            "condition": condition_desc
        })

    forecast_data = {
        "region_target": region_key,
        "latitude": coords["lat"],
        "longitude": coords["lon"],
        "forecast": processed_forecast,
        "source": "Google Weather API",
        "source_fallback": False,
    }
    save_json_cache(
        cache_filename,
        forecast_data,
        payload_key="data",
        metadata={"region_target": region_key},
    )
    return forecast_data
