import json
from datetime import datetime, timezone
from fastapi import HTTPException
from google.genai import types
from ingestion_layer.constant import REGION_DATA
from ingestion_layer.index import run_ingestion
from google.cloud import aiplatform #new
import os

async def build_disaster_intelligence(region: str, client):
    """
    Unified disaster-intelligence endpoint.

    Architecture:
        Real ingestion
            ↓
        Data normalization
            ↓
        Deterministic risk screening
            ↓
        Gemini contextual interpretation
            ↓
        Final response

    IMPORTANT:
    Gemini does not create measurements, coordinates, historical events,
    insurance payouts, or hazard observations.
    """

    region_key = region.strip().lower()

    # ---------------------------------------------------------
    # 1. RUN REAL DATA INGESTION
    # ---------------------------------------------------------
    ingestion_error = None

    try:
        unified_data = run_ingestion(region_key)

        if not isinstance(unified_data, dict):
            raise RuntimeError(
                "run_ingestion() returned an invalid response."
            )

    except Exception as error:
        ingestion_error = str(error)

        print(
            f"[DISASTER INTELLIGENCE] "
            f"Ingestion failed for '{region_key}': {error}"
        )

        # IMPORTANT:
        # Do NOT manufacture weather values here.
        #
        # We only return metadata and clearly mark the telemetry
        # as unavailable.
        fallback_region = REGION_DATA.get(region_key)

        if not fallback_region:
            raise HTTPException(
                status_code=404,
                detail=f"Unknown region: {region_key}"
            )

        unified_data = {
            "region_metadata": fallback_region,

            "meteorological_telemetry": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "region_target": region_key,
                "system_name": "Live telemetry unavailable",
                "alert_status": "DATA_UNAVAILABLE",
                "metrics": {
                    "wind_speed_kmh": None,
                    "peak_wind_kmh": None,
                    "pressure_hpa": None,
                    "central_pressure_hpa": None,
                    "storm_surge_meters": None,
                },
                "trajectory": None,
            },

            "demography": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "region_target": region_key,
                "total_population": None,
            },

            "places": {
                "hospitals": [],
                "shelters": [],
                "source_errors": {
                    "ingestion": ingestion_error
                },
            },

            "history": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "region_target": region_key,
                "historical_analogs": [],
            },

            "forecast": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "region_target": region_key,
                "forecast": [],
            },
        }

    # ---------------------------------------------------------
    # 2. NORMALIZE TELEMETRY
    # ---------------------------------------------------------

    telemetry = (
        unified_data.get("meteorological_telemetry")
        or unified_data.get("current_condition")
        or {}
    )

    if not isinstance(telemetry, dict):
        telemetry = {}

    metrics = telemetry.get("metrics")

    if not isinstance(metrics, dict):
        metrics = {}

    def first_value(*values):
        """
        Return the first value that is actually present.

        Unlike `or`, this does not accidentally replace valid
        values such as 0.
        """
        for value in values:
            if value is not None:
                return value
        return None

    def safe_float(value):
        try:
            if value is None:
                return None

            return float(value)

        except (TypeError, ValueError):
            return None

    wind = first_value(
        telemetry.get("wind_speed_kmh"),
        metrics.get("wind_speed_kmh"),
        metrics.get("peak_wind_kmh"),
    )

    pressure = first_value(
        telemetry.get("pressure_hpa"),
        metrics.get("pressure_hpa"),
        metrics.get("central_pressure_hpa"),
    )

    storm_surge = first_value(
        telemetry.get("storm_surge_meters"),
        metrics.get("storm_surge_meters"),
    )

    wind = safe_float(wind)
    pressure = safe_float(pressure)
    storm_surge = safe_float(storm_surge)

    # ---------------------------------------------------------
    # 3. DETERMINE DATA PROVENANCE
    # ---------------------------------------------------------

    telemetry_timestamp = (
        telemetry.get("timestamp")
        or telemetry.get("observed_at")
        or telemetry.get("updated_at")
    )

    telemetry_status = (
        telemetry.get("alert_status")
        or telemetry.get("status")
        or "UNKNOWN"
    )

    system_name = telemetry.get(
        "system_name",
        "Meteorological telemetry"
    )

    if ingestion_error:
        telemetry_data_status = "UNAVAILABLE"

    elif wind is not None or pressure is not None or storm_surge is not None:
        telemetry_data_status = "AVAILABLE"

    else:
        telemetry_data_status = "NO_CURRENT_MEASUREMENTS"

    # ---------------------------------------------------------
    # 4. HISTORICAL ANALOGS
    # ---------------------------------------------------------

    history = unified_data.get("history")

    if not isinstance(history, dict):
        history = unified_data.get("disaster_history", {})

    if not isinstance(history, dict):
        history = {}

    historical_analogs = history.get(
        "historical_analogs",
        []
    )

    if not isinstance(historical_analogs, list):
        historical_analogs = []

    # Never invent a historical event.
    #
    # Only accept an analog that actually came from the ingestion
    # layer.
    valid_analogs = []

    for analog in historical_analogs:
        if not isinstance(analog, dict):
            continue

        name = (
            analog.get("matched_cyclone")
            or analog.get("event_name")
            or analog.get("name")
            or analog.get("title")
        )

        if name:
            valid_analogs.append(analog)

    primary_analog = None

    if valid_analogs:
        primary_analog = (
            valid_analogs[0].get("matched_cyclone")
            or valid_analogs[0].get("event_name")
            or valid_analogs[0].get("name")
            or valid_analogs[0].get("title")
        )

    # ---------------------------------------------------------
    # 5. FORECAST
    # ---------------------------------------------------------

    forecast = unified_data.get("forecast")

    if not isinstance(forecast, dict):
        # Backward compatibility with your previous typo.
        forecast = unified_data.get("forcast", {})

    if not isinstance(forecast, dict):
        forecast = {}

    forecast_items = forecast.get("forecast", [])

    if not isinstance(forecast_items, list):
        forecast_items = []

    # ---------------------------------------------------------
    # 6. REGION METADATA
    # ---------------------------------------------------------

    region_meta = unified_data.get(
        "region_metadata"
    ) or REGION_DATA.get(region_key, {})

    if not isinstance(region_meta, dict):
        region_meta = {}

    min_lat = safe_float(region_meta.get("min_lat"))
    max_lat = safe_float(region_meta.get("max_lat"))
    min_lon = safe_float(region_meta.get("min_lon"))
    max_lon = safe_float(region_meta.get("max_lon"))

    center_lat = None
    center_lon = None

    if (
        min_lat is not None
        and max_lat is not None
    ):
        center_lat = (min_lat + max_lat) / 2

    if (
        min_lon is not None
        and max_lon is not None
    ):
        center_lon = (min_lon + max_lon) / 2

    # ---------------------------------------------------------
    # 7. DETERMINISTIC RISK SCREENING
    # ---------------------------------------------------------
    #
    # This is deliberately NOT an official evacuation model.
    #
    # It is a transparent screening layer until we connect
    # authoritative hazard grids / IMD warnings / GEE exposure
    # layers.
    #
    # IMPORTANT:
    # Missing data does NOT become zero.
    # ---------------------------------------------------------

    risk_factors = []
    risk_score = 0

    if wind is not None:

        if wind >= 118:
            risk_score += 45
            risk_factors.append(
                f"Very high wind observation: {wind:.1f} km/h"
            )

        elif wind >= 88:
            risk_score += 35
            risk_factors.append(
                f"High wind observation: {wind:.1f} km/h"
            )

        elif wind >= 62:
            risk_score += 20
            risk_factors.append(
                f"Strong wind observation: {wind:.1f} km/h"
            )

    if pressure is not None:

        if pressure <= 980:
            risk_score += 30
            risk_factors.append(
                f"Very low atmospheric pressure: {pressure:.1f} hPa"
            )

        elif pressure <= 995:
            risk_score += 20
            risk_factors.append(
                f"Low atmospheric pressure: {pressure:.1f} hPa"
            )

    if storm_surge is not None:

        if storm_surge >= 2.0:
            risk_score += 35
            risk_factors.append(
                f"Storm surge estimate: {storm_surge:.2f} m"
            )

        elif storm_surge >= 1.2:
            risk_score += 25
            risk_factors.append(
                f"Storm surge estimate: {storm_surge:.2f} m"
            )

        elif storm_surge >= 0.5:
            risk_score += 10
            risk_factors.append(
                f"Storm surge estimate: {storm_surge:.2f} m"
            )

    # Cap screening score.
    risk_score = min(risk_score, 100)

    # ---------------------------------------------------------
    # 7.5 VERTEX AI AUTOML PREDICTION (NEW LAYER)
    # ---------------------------------------------------------
    ml_prediction_result = None
    if telemetry_data_status == "AVAILABLE":
        try:
            # Use the endpoint details from your screenshot
            PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT") # Ensure this is set in your .env
            ENDPOINT_ID = "3407664161163837440" 
            LOCATION = "us-central1"

            if PROJECT_ID:
                aiplatform.init(project=PROJECT_ID, location=LOCATION)
                endpoint = aiplatform.Endpoint(endpoint_name=f"projects/{PROJECT_ID}/locations/{LOCATION}/endpoints/{ENDPOINT_ID}")

                # IMPORTANT: Update these keys to match the exact column names used in your AutoML training dataset!
                # Format time exactly as the model expects
                formatted_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                # You must pass all 23 feature columns (assuming 'cyclone_status' is the target)
                instance = {
                    "basin": "BoB", 
                    "cloud_cover_percent": "0.0",
                    "country_region": "India",
                    "distance_to_coast_km": "0.0",
                    "elevation_m": "0.0",
                    "humidity_percent": "0.0",
                    "latitude": str(center_lat) if center_lat else "0.0",
                    "longitude": str(center_lon) if center_lon else "0.0",
                    "pressure_change_12h_hpa": "0.0",
                    "pressure_change_3h_hpa": "0.0",
                    "pressure_change_6h_hpa": "0.0",
                    "pressure_hpa": str(pressure) if pressure else "1013.0",
                    "rainfall_1h_mm": "0.0",
                    "rainfall_24h_mm": "0.0",
                    "rainfall_6h_mm": "0.0",
                    "sea_level_anomaly_m": str(storm_surge) if storm_surge else "0.0",
                    "sea_surface_temperature_c": "28.0",
                    "temperature_c": "28.0",
                    "timestamp": formatted_time,
                    "water_fraction": "0.0",
                    "wind_direction_deg": "0.0",
                    "wind_gust_kmh": str(wind * 1.2) if wind else "0.0", # Rough estimate if gust is missing
                    "wind_speed_kmh": str(wind) if wind else "0.0"
                }

                prediction = endpoint.predict(instances=[instance])
                
                if prediction.predictions:
                    ml_prediction_result = prediction.predictions[0]
                    # Pass the ML result into the context for Gemini to see
                    risk_factors.append(f"AutoML Classification Result: {ml_prediction_result}")
            else:
                print("[VERTEX AI] GOOGLE_CLOUD_PROJECT not set in environment.")

        except Exception as e:
            print(f"[VERTEX AI] Prediction failed or still deploying: {e}")

    # ---------------------------------------------------------
    # 8. RISK LEVEL
    # ---------------------------------------------------------

    if telemetry_data_status != "AVAILABLE":
        risk_level = "UNKNOWN"

    elif risk_score >= 75:
        risk_level = "RED"

    elif risk_score >= 50:
        risk_level = "ORANGE"

    elif risk_score >= 25:
        risk_level = "YELLOW"

    else:
        risk_level = "GREEN"

    # ---------------------------------------------------------
    # 9. RISK ZONES
    # ---------------------------------------------------------
    #
    # These are screening zones around the region center.
    #
    # They are NOT claimed to be official evacuation boundaries.
    #
    # The frontend should display this distinction.
    # ---------------------------------------------------------

    risk_zones = []

    if center_lat is not None and center_lon is not None:

        if risk_level == "RED":

            risk_zones = [
                {
                    "id": "red-zone",
                    "label": "Red Zone",
                    "color": "red",
                    "lat": center_lat,
                    "lon": center_lon,
                    "radius_km": 7.5,
                    "description": (
                        "High-risk screening zone based on "
                        "current hazard indicators."
                    ),
                    "basis": risk_factors,
                },
                {
                    "id": "orange-zone",
                    "label": "Orange Zone",
                    "color": "orange",
                    "lat": center_lat,
                    "lon": center_lon,
                    "radius_km": 15,
                    "description": (
                        "Potential impact screening zone."
                    ),
                    "basis": risk_factors,
                },
            ]

        elif risk_level == "ORANGE":

            risk_zones = [
                {
                    "id": "orange-zone",
                    "label": "Orange Zone",
                    "color": "orange",
                    "lat": center_lat,
                    "lon": center_lon,
                    "radius_km": 10,
                    "description": (
                        "Elevated-risk screening zone."
                    ),
                    "basis": risk_factors,
                },
                {
                    "id": "yellow-zone",
                    "label": "Yellow Zone",
                    "color": "yellow",
                    "lat": center_lat,
                    "lon": center_lon,
                    "radius_km": 20,
                    "description": (
                        "Potential impact / preparedness zone."
                    ),
                    "basis": risk_factors,
                },
            ]

        elif risk_level == "YELLOW":

            risk_zones = [
                {
                    "id": "yellow-zone",
                    "label": "Yellow Zone",
                    "color": "yellow",
                    "lat": center_lat,
                    "lon": center_lon,
                    "radius_km": 15,
                    "description": (
                        "Preparedness screening zone."
                    ),
                    "basis": risk_factors,
                },
                {
                    "id": "green-zone",
                    "label": "Green Zone",
                    "color": "green",
                    "lat": center_lat,
                    "lon": center_lon,
                    "radius_km": 30,
                    "description": (
                        "Currently lower modeled exposure."
                    ),
                    "basis": risk_factors,
                },
            ]

        elif risk_level == "GREEN":

            risk_zones = [
                {
                    "id": "green-zone",
                    "label": "Green Zone",
                    "color": "green",
                    "lat": center_lat,
                    "lon": center_lon,
                    "radius_km": 20,
                    "description": (
                        "No elevated hazard signal detected "
                        "from currently available telemetry."
                    ),
                    "basis": risk_factors,
                }
            ]

    # ---------------------------------------------------------
    # 10. INSURANCE / PARAMETRIC TRIGGER
    # ---------------------------------------------------------
    #
    # Do NOT invent payout values.
    #
    # If actual storm surge data is unavailable, the trigger
    # cannot be evaluated.
    # ---------------------------------------------------------

    trigger_threshold_m = 1.2

    if storm_surge is None:

        insurance_summary = {
            "status": "UNAVAILABLE",
            "trigger_met": None,
            "trigger_threshold_m": trigger_threshold_m,
            "observed_water_depth_m": None,
            "estimated_payout_cr": None,
            "headline": (
                "Parametric trigger cannot be evaluated "
                "because current water-depth data is unavailable."
            ),
            "coverage_focus": [
                "Coastal wards",
                "Critical infrastructure",
                "Low-lying settlements",
            ],
        }

    else:

        trigger_met = (
            storm_surge >= trigger_threshold_m
        )

        insurance_summary = {
            "status": "EVALUATED",
            "trigger_met": trigger_met,
            "trigger_threshold_m": trigger_threshold_m,
            "observed_water_depth_m": round(
                storm_surge,
                2
            ),
            "estimated_payout_cr": None,
            "headline": (
                "Configured trigger threshold reached."
                if trigger_met
                else "Configured trigger threshold not reached."
            ),
            "coverage_focus": [
                "Coastal wards",
                "Critical infrastructure",
                "Low-lying settlements",
            ],
            "note": (
                "Payout amount is not calculated because "
                "no actual insurance policy configuration "
                "is connected to this endpoint."
            ),
        }

    # ---------------------------------------------------------
    # 11. GEMINI CONTEXT
    # ---------------------------------------------------------
    #
    # Gemini gets verified/derived backend information.
    #
    # It does NOT get permission to create:
    # - weather observations
    # - coordinates
    # - insurance payouts
    # - historical events
    # ---------------------------------------------------------

    ai_context = {
        "region": region_key,

        "current_telemetry": {
            "wind_speed_kmh": wind,
            "pressure_hpa": pressure,
            "storm_surge_meters": storm_surge,
            "timestamp": telemetry_timestamp,
            "status": telemetry_data_status,
            "source_system": system_name,
        },
        "ml_classification_model": ml_prediction_result, # <-- Passed to Gemini
        "risk_assessment": {
            "level": risk_level,
            "score": risk_score,
            "factors": risk_factors,
        },

        "historical_analogs": valid_analogs[:5],

        "forecast": forecast_items[:10],

        "demography": unified_data.get(
            "demography",
            {}
        ),

        "places": unified_data.get(
            "places",
            {}
        ),
    }

    tactical_insights = {
        "summary": None,
        "recommended_tasks": [],
        "reasoning_context": [],
    }

    # ---------------------------------------------------------
    # 12. GEMINI = EXPLANATION / PREPARATION ASSISTANT
    # ---------------------------------------------------------

    if client is not None:

        prompt = f"""
You are an AI disaster-preparedness assistant.

You must ONLY reason from the supplied backend data.

IMPORTANT RULES:

1. Never invent weather observations.
2. Never invent storm-surge measurements.
3. Never invent historical disasters.
4. Never invent population numbers.
5. Never invent shelters or hospitals.
6. Never invent insurance payout amounts.
7. Never create new coordinates.
8. Never change the backend risk level.
9. If data is missing, explicitly say that it is unavailable.
10. Do not claim that an area is under an official evacuation order.
11. Provide practical preparedness actions based only on available evidence.

The backend has already calculated the risk screening.

BACKEND DATA:

{json.dumps(ai_context, indent=2, default=str)}

Return ONLY JSON in this exact structure:

{{
    "summary": "Short explanation of the current situation based only on the supplied data.",

    "recommended_tasks": [
        {{
            "department": "Relevant response department",
            "location": "Only use a location explicitly present in the supplied data",
            "description": "Practical preparation action justified by the available data",
            "priority": "critical|high|moderate|low"
        }}
    ],

    "reasoning_context": [
        "Specific supplied fact supporting the recommendation"
    ]
}}

If the telemetry status is UNAVAILABLE or NO_CURRENT_MEASUREMENTS,
do not pretend current hazard conditions are known.
"""

        try:

            response = client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )

            parsed_ai = json.loads(response.text)

            if isinstance(parsed_ai, dict):

                tactical_insights = {
                    "summary": parsed_ai.get(
                        "summary"
                    ),

                    "recommended_tasks": (
                        parsed_ai.get(
                            "recommended_tasks",
                            []
                        )
                        if isinstance(
                            parsed_ai.get(
                                "recommended_tasks",
                                []
                            ),
                            list
                        )
                        else []
                    ),

                    "reasoning_context": (
                        parsed_ai.get(
                            "reasoning_context",
                            []
                        )
                        if isinstance(
                            parsed_ai.get(
                                "reasoning_context",
                                []
                            ),
                            list
                        )
                        else []
                    ),
                }

        except Exception as error:

            print(
                f"[GEMINI] Disaster intelligence "
                f"analysis failed: {error}"
            )

            tactical_insights = {
                "summary": (
                    "AI analysis is currently unavailable. "
                    "The response contains backend-derived "
                    "risk information."
                ),

                "recommended_tasks": [],

                "reasoning_context": risk_factors,
            }

    # ---------------------------------------------------------
    # 13. FINAL RESPONSE
    # ---------------------------------------------------------

    return {
        "status": "success",

        "region": region_key,
        "ml_prediction": ml_prediction_result,
        "generated_at": datetime.now(
            timezone.utc
        ).isoformat(),

        "data_quality": {
            "ingestion_status": (
                "FAILED"
                if ingestion_error
                else "SUCCESS"
            ),

            "telemetry_status": telemetry_data_status,

            "ingestion_error": ingestion_error,

            "telemetry_timestamp": telemetry_timestamp,

            "sources": {
                "meteorological": system_name,
                "history": (
                    history.get("source")
                    if isinstance(history, dict)
                    else None
                ),
                "forecast": (
                    forecast.get("source")
                    if isinstance(forecast, dict)
                    else None
                ),
            },
        },

        "current_conditions": {
            "wind_speed_kmh": wind,
            "pressure_hpa": pressure,
            "storm_surge_meters": storm_surge,
            "alert_status": telemetry_status,
        },

        "forecast": {
            "items": forecast_items,
            "source": forecast.get("source"),
            "timestamp": forecast.get("timestamp"),
        },

        "risk_assessment": {
            "level": risk_level,
            "score": risk_score,
            "factors": risk_factors,
            "method": (
                "Backend deterministic screening "
                "from available telemetry"
            ),
            "official_warning": False,
            "note": (
                "This screening result is not an official "
                "evacuation order or government warning."
            ),
        },

        "risk_zones": risk_zones,

        "historical_context": {
            "primary_analog": primary_analog,
            "historical_analogs": valid_analogs[:5],
        },

        "demography": unified_data.get(
            "demography",
            {}
        ),

        "critical_places": unified_data.get(
            "places",
            {}
        ),

        "insurance_summary": insurance_summary,

        "ai_analysis": tactical_insights,

        # VERY IMPORTANT:
        # Keep the actual ingestion context available.
        # This lets your frontend explain why the AI produced
        # its recommendations.
        "supporting_context": {
            "telemetry": telemetry,
            "risk_factors": risk_factors,
            "historical_analogs": valid_analogs[:5],
        },
    }
