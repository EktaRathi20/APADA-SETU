import json

from google.genai import types

from ingestion_layer.index import run_ingestion
from services.ai_client import client


async def create_dispatch_response(query: str, region: str) -> dict:
    if client is None:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    places_data = []
    try:
        unified_data = run_ingestion(region)
        places = unified_data.get("places", {})
        if isinstance(places, dict):
            for place_type in ("hospitals", "shelters"):
                facilities = places.get(place_type, [])
                if isinstance(facilities, list):
                    places_data.extend(
                        {"type": place_type[:-1], **facility}
                        for facility in facilities
                        if isinstance(facility, dict)
                    )
    except Exception as error:
        print(f"Warning: Could not fetch live ingested data - {error}")

    prompt = f"""
    You are APADA-SETU Verified Dispatch, an AI tactical routing assistant for {region}.

    The user entered the command: "{query}"

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

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )
    return json.loads(response.text)
