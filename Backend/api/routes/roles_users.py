from pathlib import Path
import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request

BACKEND_DIR = Path(__file__).resolve().parents[2]
KEY_PATH = BACKEND_DIR / "firebase" / "serviceAccountKey.json"

if not firebase_admin._apps:
    cred = credentials.Certificate(str(KEY_PATH))
    firebase_admin.initialize_app(cred)

db = firestore.client()

def serialize_document(doc) -> dict[str, Any]:
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return data

router = APIRouter()
# ---------------- ROLES APIs ----------------

@router.get("/api/roles")
def get_roles() -> dict[str, Any]:
    """Fetch all role definitions."""
    try:
        docs = db.collection("dm_roles").stream()
        roles = [serialize_document(doc) for doc in docs]
        roles.sort(key=lambda role: role.get("level", 999))

        return {
            "success": True,
            "count": len(roles),
            "roles": roles,
        }
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch roles.",
        )


@router.get("/api/roles/{role_id}")
def get_role(role_id: str) -> dict[str, Any]:
    """Fetch one role by document ID."""
    try:
        doc = db.collection("dm_roles").document(role_id).get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Role not found")

        return {
            "success": True,
            "role": serialize_document(doc),
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch role.",
        )


# ---------------- USERS APIs ----------------

@router.get("/api/users")
def get_users() -> dict[str, Any]:
    """Fetch users. Protect this endpoint before production deployment."""
    try:
        docs = db.collection("dm_users").stream()
        users = [serialize_document(doc) for doc in docs]

        return {
            "success": True,
            "count": len(users),
            "users": users,
        }
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch users.",
        )


@router.get("/api/users/{user_id}")
def get_user(user_id: str) -> dict[str, Any]:
    """Fetch one user by Firestore document ID."""
    try:
        doc = db.collection("dm_users").document(user_id).get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "success": True,
            "user": serialize_document(doc),
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch user.",
        )
