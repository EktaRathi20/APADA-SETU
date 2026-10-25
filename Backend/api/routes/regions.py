from pathlib import Path
from typing import Any, Optional

import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field


# --------------------------------------------------
# Firebase initialization
# --------------------------------------------------

BACKEND_DIR = Path(__file__).resolve().parents[2]
KEY_PATH = BACKEND_DIR / "firebase" / "serviceAccountKey.json"

if not KEY_PATH.exists():
    raise FileNotFoundError(
        f"Firebase service account key not found: {KEY_PATH}"
    )

if not firebase_admin._apps:
    cred = credentials.Certificate(str(KEY_PATH))
    firebase_admin.initialize_app(cred)

db = firestore.client()
router = APIRouter()


# --------------------------------------------------
# Firestore references
# --------------------------------------------------

REGIONS_COLLECTION = "regions"
HAZARDS_COLLECTION = "hazardTypes"

CONFIG_COLLECTION = "settings"
CONFIG_DOCUMENT = "regionManagement"


# --------------------------------------------------
# Models
# --------------------------------------------------

class RegionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    type: str = Field(min_length=1, max_length=50)
    parentRegionId: Optional[str] = None
    code: Optional[str] = None
    active: bool = True
    hazardIds: list[str] = Field(default_factory=list)


class RegionUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    type: Optional[str] = Field(default=None, min_length=1, max_length=50)
    parentRegionId: Optional[str] = None
    code: Optional[str] = None
    active: Optional[bool] = None
    hazardIds: Optional[list[str]] = None


class RegionConfiguration(BaseModel):
    defaultRegionId: Optional[str] = None


# --------------------------------------------------
# Helpers
# --------------------------------------------------

def serialize_document(doc) -> dict[str, Any]:
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return data


def get_configuration_data() -> dict[str, Any]:
    doc = db.collection(CONFIG_COLLECTION).document(
        CONFIG_DOCUMENT
    ).get()

    if not doc.exists:
        return {
            "defaultRegionId": None,
        }

    data = doc.to_dict() or {}

    return {
        "defaultRegionId": data.get("defaultRegionId"),
    }


def validate_configuration(config: RegionConfiguration) -> None:
    if config.defaultRegionId:
        region_doc = db.collection(REGIONS_COLLECTION).document(
            config.defaultRegionId
        ).get()

        if not region_doc.exists:
            raise HTTPException(
                status_code=400,
                detail="Selected default region does not exist.",
            )

        region_data = region_doc.to_dict() or {}

        if region_data.get("active") is False:
            raise HTTPException(
                status_code=400,
                detail="Inactive region cannot be selected as default.",
            )

    


def save_configuration_data(
    config: RegionConfiguration,
    merge: bool = True,
) -> dict[str, Any]:
    validate_configuration(config)

    payload = {
        "defaultRegionId": config.defaultRegionId,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }

    db.collection(CONFIG_COLLECTION).document(
        CONFIG_DOCUMENT
    ).set(payload, merge=merge)

    return get_configuration_data()


# --------------------------------------------------
# GET: Hazard list
# GET /api/hazard-types
# --------------------------------------------------

@router.get("/api/hazard-types")
def get_hazard_types(
    activeOnly: bool = Query(default=True),
):
    try:
        docs = db.collection(HAZARDS_COLLECTION).stream()
        hazards = [serialize_document(doc) for doc in docs]

        if activeOnly:
            hazards = [
                hazard for hazard in hazards
                if hazard.get("active", True) is not False
            ]

        hazards.sort(key=lambda item: item.get("name", "").lower())

        return {
            "success": True,
            "count": len(hazards),
            "hazards": hazards,
            "items": hazards,
        }

    except Exception as exc:
        print(f"Error loading hazard types: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to load hazard types.",
        )


# --------------------------------------------------
# GET: Region list
# GET /api/regions
# --------------------------------------------------

@router.get("/api/regions")
def get_regions(
    activeOnly: bool = Query(default=False),
    limit: int = Query(default=500, ge=1, le=1000),
):
    try:
        docs = (
            db.collection(REGIONS_COLLECTION)
            .limit(limit)
            .stream()
        )

        regions = [serialize_document(doc) for doc in docs]

        if activeOnly:
            regions = [
                region for region in regions
                if region.get("active", True) is not False
            ]

        regions.sort(key=lambda item: item.get("name", "").lower())

        return {
            "success": True,
            "count": len(regions),
            "regions": regions,
            "items": regions,
        }

    except Exception as exc:
        print(f"Error loading regions: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to load regions.",
        )


# --------------------------------------------------
# POST: Create region
# POST /api/regions
# --------------------------------------------------

@router.post("/api/regions", status_code=201)
def create_region(payload: RegionCreate):
    try:
        name = payload.name.strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Region name is required.",
            )

        if payload.parentRegionId:
            parent_doc = db.collection(REGIONS_COLLECTION).document(
                payload.parentRegionId
            ).get()

            if not parent_doc.exists:
                raise HTTPException(
                    status_code=400,
                    detail="Parent region does not exist.",
                )

            parent_data = parent_doc.to_dict() or {}

            if parent_data.get("active") is False:
                raise HTTPException(
                    status_code=400,
                    detail="Parent region is inactive.",
                )

        region_data = {
            "name": name,
            "type": payload.type.strip(),
            "parentRegionId": payload.parentRegionId,
            "code": payload.code.strip() if payload.code else None,
            "active": payload.active,
            "hazardIds": payload.hazardIds,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }

        doc_ref = db.collection(REGIONS_COLLECTION).document()
        doc_ref.set(region_data)

        return {
            "success": True,
            "message": "Region created successfully.",
            "region": serialize_document(doc_ref.get()),
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error creating region: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create region.",
        )


# --------------------------------------------------
# PUT: Update region
# PUT /api/regions/{region_id}
# --------------------------------------------------

@router.put("/api/regions/{region_id}")
def update_region(region_id: str, payload: RegionUpdate):
    try:
        doc_ref = db.collection(REGIONS_COLLECTION).document(region_id)

        if not doc_ref.get().exists:
            raise HTTPException(
                status_code=404,
                detail="Region not found.",
            )

        updates = payload.model_dump(exclude_unset=True)

        if "name" in updates and updates["name"] is not None:
            updates["name"] = updates["name"].strip()

            if not updates["name"]:
                raise HTTPException(
                    status_code=400,
                    detail="Region name cannot be empty.",
                )

        if "type" in updates and updates["type"] is not None:
            updates["type"] = updates["type"].strip()

        if "code" in updates and updates["code"] is not None:
            updates["code"] = updates["code"].strip() or None

        if updates.get("parentRegionId"):
            if updates["parentRegionId"] == region_id:
                raise HTTPException(
                    status_code=400,
                    detail="A region cannot be its own parent.",
                )

            parent_doc = db.collection(REGIONS_COLLECTION).document(
                updates["parentRegionId"]
            ).get()

            if not parent_doc.exists:
                raise HTTPException(
                    status_code=400,
                    detail="Parent region does not exist.",
                )

        updates["updatedAt"] = firestore.SERVER_TIMESTAMP
        doc_ref.update(updates)

        return {
            "success": True,
            "message": "Region updated successfully.",
            "region": serialize_document(doc_ref.get()),
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error updating region: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update region.",
        )


# --------------------------------------------------
# DELETE: Delete region
# DELETE /api/regions/{region_id}
# --------------------------------------------------

@router.delete("/api/regions/{region_id}")
def delete_region(region_id: str):
    try:
        doc_ref = db.collection(REGIONS_COLLECTION).document(region_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(
                status_code=404,
                detail="Region not found.",
            )

        # Do not delete a region that has child regions.
        children = (
            db.collection(REGIONS_COLLECTION)
            .where("parentRegionId", "==", region_id)
            .limit(1)
            .stream()
        )

        if any(True for _ in children):
            raise HTTPException(
                status_code=409,
                detail="Cannot delete a region that has child regions.",
            )

        config = get_configuration_data()

        if config["defaultRegionId"] == region_id:
            raise HTTPException(
                status_code=409,
                detail="Cannot delete the default region. Change the default first.",
            )

        doc_ref.delete()

        return {
            "success": True,
            "message": "Region deleted successfully.",
            "id": region_id,
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error deleting region: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete region.",
        )


# --------------------------------------------------
# GET: Read saved configuration
# GET /api/region-configuration
# --------------------------------------------------

@router.get("/api/region-configuration")
def get_region_configuration():
    try:
        doc = (
            db.collection("settings")
            .document("regionManagement")
            .get()
        )

        if not doc.exists:
            config = {
                "defaultRegionId": None,
            }
        else:
            data = doc.to_dict() or {}
            config = {
                "defaultRegionId": data.get("defaultRegionId"),
            }

        return {
            "success": True,
            "exists": doc.exists,
            "configuration": config,
            **config,
        }

    except Exception as exc:
        print(f"Error reading region configuration: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to load region configuration.",
        )


# --------------------------------------------------
# POST: Create configuration
# POST /api/region-configuration
# --------------------------------------------------

@router.post("/api/region-configuration", status_code=201)
def create_region_configuration(payload: RegionConfiguration):
    try:
        doc_ref = db.collection(CONFIG_COLLECTION).document(
            CONFIG_DOCUMENT
        )

        if doc_ref.get().exists:
            raise HTTPException(
                status_code=409,
                detail="Configuration already exists. Use PUT to update it.",
            )

        config = save_configuration_data(payload, merge=False)

        return {
            "success": True,
            "message": "Region configuration created successfully.",
            "configuration": config,
            **config,
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error creating region configuration: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create region configuration.",
        )


# --------------------------------------------------
# PUT: Update or save configuration
# PUT /api/region-configuration
# --------------------------------------------------

@router.put("/api/region-configuration")
def update_region_configuration(payload: RegionConfiguration):
    try:
        doc_ref = db.collection(CONFIG_COLLECTION).document(
            CONFIG_DOCUMENT
        )

        if not doc_ref.get().exists:
            raise HTTPException(
                status_code=404,
                detail="Configuration does not exist. Use POST to create it.",
            )

        config = save_configuration_data(payload, merge=True)

        return {
            "success": True,
            "message": "Region configuration updated successfully.",
            "configuration": config,
            **config,
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error updating region configuration: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update region configuration.",
        )


# --------------------------------------------------
# DELETE: Delete/reset configuration
# DELETE /api/region-configuration
# --------------------------------------------------

@router.delete("/api/region-configuration")
def delete_region_configuration():
    try:
        doc_ref = db.collection(CONFIG_COLLECTION).document(
            CONFIG_DOCUMENT
        )

        if not doc_ref.get().exists:
            raise HTTPException(
                status_code=404,
                detail="Configuration not found.",
            )

        doc_ref.delete()

        return {
            "success": True,
            "message": "Region configuration deleted successfully.",
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error deleting region configuration: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete region configuration.",
        )
