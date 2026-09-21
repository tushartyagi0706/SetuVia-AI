from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from app.services import itinerary_service
from app.models.requests import TripPreferencesRequest, ModifyItineraryRequest
from app.models.responses import ItineraryResponse

router = APIRouter()


@router.post("/itinerary/generate", response_model=ItineraryResponse, tags=["Itinerary"])
async def generate_itinerary(
    prefs: TripPreferencesRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Generate a grounded travel itinerary using MongoDB Atlas verified POIs,
    deterministic candidate scoring, and Gemini AI.
    """
    try:
        return await itinerary_service.generate_full_itinerary(db, prefs)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Itinerary generation failed: {str(e)}"
        )


@router.post("/itinerary/modify", tags=["Itinerary"])
async def modify_itinerary(
    req: ModifyItineraryRequest
):
    """
    Modify an existing itinerary using natural language chat instructions and Gemini AI.
    """
    try:
        modified_itinerary, reply = await itinerary_service.modify_existing_itinerary(
            req.current_itinerary, req.user_request
        )
        return {
            "itinerary": modified_itinerary,
            "reply": reply
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Itinerary modification failed: {str(e)}"
        )
