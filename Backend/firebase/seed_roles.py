
import firebase_admin
from firebase_admin import credentials, firestore

# Firebase authentication
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

# 1. Roles
roles = [
    {
        "name": "Disaster Assessment Officer",
        "level": 1,
        "description": "Reviews disaster alerts and approves or rejects proposed disasters.",
        "isActive": True,
    },
    {
        "name": "Operations Planner",
        "level": 2,
        "description": "Reviews response plans, manages tasks, and assigns work to field teams.",
        "isActive": True,
    },
    {
        "name": "Field Operations Officer",
        "level": 3,
        "description": "Executes assigned disaster response tasks and reports field progress.",
        "isActive": True,
    },
    {
        "name": "Insurance Recovery Officer",
        "level": 4,
        "description": "Reviews damage assessments, insurance cases, and recovery recommendations.",
        "isActive": True,
    },
    {
        "name": "Rescue Relief Officer",
        "level": 5,
        "description": "Coordinates rescue operations and uses AI support for routes and shelters.",
        "isActive": True,
    },
]

# 2. Sample users — demo data only
users = [
    {
        "name": "Aarav Sharma",
        "email": "aarav.demo@example.com",
        "roleId": "role_1",
        "isActive": True,
    },
    {
        "name": "Priya Verma",
        "email": "priya.demo@example.com",
        "roleId": "role_2",
        "isActive": True,
    },
    {
        "name": "Rahul Singh",
        "email": "rahul.demo@example.com",
        "roleId": "role_3",
        "isActive": True,
    },
    {
        "name": "Ananya Patel",
        "email": "ananya.demo@example.com",
        "roleId": "role_4",
        "isActive": True,
    },
    {
        "name": "Vikram Joshi",
        "email": "vikram.demo@example.com",
        "roleId": "role_5",
        "isActive": True,
    },
]

# 3. Upload roles and users together
batch = db.batch()

for index, role in enumerate(roles, start=1):
    role_ref = db.collection("dm_roles").document(f"role_{index}")
    batch.set(role_ref, role)

for index, user in enumerate(users, start=1):
    user_ref = db.collection("dm_users").document(f"user_{index}")
    batch.set(user_ref, user)

batch.commit()

print("Successfully uploaded 5 roles and 5 sample users!")
