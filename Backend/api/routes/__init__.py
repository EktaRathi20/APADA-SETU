from fastapi import APIRouter

from api.routes.alerts import router as alerts_router
from api.routes.data import router as data_router
from api.routes.intelligence import router as intelligence_router
from api.routes.whatsapp import router as whatsapp_router


router = APIRouter()
router.include_router(data_router)
router.include_router(alerts_router)
router.include_router(whatsapp_router)
router.include_router(intelligence_router)
