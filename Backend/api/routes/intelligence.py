from fastapi import APIRouter, BackgroundTasks, HTTPException, Request

from ingestion_layer.disaster_intelligence import build_disaster_intelligence
from schemas.requests import DispatchChatRequest
from services.alert_service import emit_risk_assessment_alert
from services.ai_client import client
from services.dispatch_service import create_dispatch_response


router = APIRouter()


@router.get("/api/disaster-intelligence/{region}")
async def get_disaster_intelligence(region: str, request: Request, background_tasks: BackgroundTasks):
    result = await build_disaster_intelligence(region, client)
    await emit_risk_assessment_alert(
        result.get("region", region.strip().lower()),
        result,
        background_tasks,
        request.app.state.socket_server,
    )
    return result


@router.post("/api/dispatch-chat")
async def process_dispatch_chat(request: DispatchChatRequest):
    try:
        return await create_dispatch_response(request.query, request.region)
    except Exception as error:
        print(f"Chat API Error: {error}")
        raise HTTPException(status_code=500, detail="Failed to generate route clearance")
