from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore


# Firebase authentication
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

# --------------------------------------------------
# Default hazard types
# --------------------------------------------------

HAZARDS = [
    {
        "id": "flood",
        "name": "Flood",
        "code": "FLOOD",
        "description": "Flooding caused by heavy rainfall or overflowing water.",
        "active": True,
    },
    {
        "id": "cyclone",
        "name": "Cyclone",
        "code": "CYCLONE",
        "description": "Cyclonic storms and associated hazards.",
        "active": True,
    },
    {
        "id": "fire",
        "name": "Fire",
        "code": "FIRE",
        "description": "Urban, structural, and wildland fire incidents.",
        "active": True,
    },
    {
        "id": "heatwave",
        "name": "Heatwave",
        "code": "HEATWAVE",
        "description": "Extreme heat events.",
        "active": True,
    },
    {
        "id": "landslide",
        "name": "Landslide",
        "code": "LANDSLIDE",
        "description": "Slope failure and landslide incidents.",
        "active": True,
    },
    {
        "id": "earthquake",
        "name": "Earthquake",
        "code": "EARTHQUAKE",
        "description": "Seismic events and associated impacts.",
        "active": True,
    },
    {
        "id": "drought",
        "name": "Drought",
        "code": "DROUGHT",
        "description": "Prolonged rainfall deficiency and water scarcity.",
        "active": True,
    },
]


# --------------------------------------------------
# Seed Firestore
# --------------------------------------------------

def seed_hazards():
    collection = db.collection("hazardTypes")
    batch = db.batch()

    for hazard in HAZARDS:
        hazard_id = hazard["id"]
        document_data = {
            key: value
            for key, value in hazard.items()
            if key != "id"
        }

        document_data["updatedAt"] = firestore.SERVER_TIMESTAMP

        batch.set(
            collection.document(hazard_id),
            document_data,
            merge=True,
        )

    batch.commit()

    print(f"Successfully seeded {len(HAZARDS)} hazard types.")

    for hazard in HAZARDS:
        print(f"  - {hazard['id']}: {hazard['name']}")


if __name__ == "__main__":
    seed_hazards()