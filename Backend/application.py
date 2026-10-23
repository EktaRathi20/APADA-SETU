import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router
from ingestion_layer.gee import init_gee


def create_api_app() -> FastAPI:
    api_app = FastAPI(
        title="APADA-SETU API",
        description="Backend API powering the Municipal Resilience & Disaster Digital Twin",
        version="1.0.0",
    )
    api_app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "*",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    api_app.include_router(router)

    @api_app.on_event("startup")
    def startup_event():
        try:
            init_gee()
            print("Google Earth Engine initialized for API server.")
        except Exception as error:
            print(f"Earth Engine Initialization Warning: {error}")

    return api_app


api_app = create_api_app()
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
api_app.state.socket_server = sio
app = socketio.ASGIApp(sio, other_asgi_app=api_app)
