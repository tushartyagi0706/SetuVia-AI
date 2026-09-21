from fastapi import APIRouter
from app.api.v1.endpoints import places, itinerary, stays, chat

api_router = APIRouter()
api_router.include_router(places.router)
api_router.include_router(itinerary.router)
api_router.include_router(stays.router)
api_router.include_router(chat.router)


@api_router.get("/health", tags=["Health"])
async def v1_health_check():
    return {
        "status": "ok",
        "service": "setuvia-backend-v1",
        "database": "setuvia"
    }

