from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from app.db import queries
from app.engine import costs, stay
from app.services import itinerary_service
from app.models.requests import (
    TripPreferencesRequest,
    ModifyItineraryRequest,
    TransparentBudgetRequest,
    OptimizeBudgetRequest,
    RegenerateDayRequest,
)
from app.models.responses import (
    ItineraryResponse,
    TransparentBudgetResponse,
    OptimizeBudgetResponse,
)

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


@router.post("/itinerary/budget", response_model=TransparentBudgetResponse, tags=["Itinerary"])
async def calculate_transparent_budget(
    req: TransparentBudgetRequest
):
    """
    Calculate transparent trip budget summary and expense breakdown.
    Stay cost remains null as stay pricing is unverified in database.
    """
    try:
        return costs.compute_transparent_budget(req.current_itinerary, req.total_budget)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Budget calculation failed: {str(e)}"
        )


@router.post("/itinerary/optimize-budget", response_model=OptimizeBudgetResponse, tags=["Itinerary"])
async def optimize_itinerary_budget(
    req: OptimizeBudgetRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Auto-optimize trip itinerary to fit target budget by selecting cheaper verified MongoDB candidates.
    """
    try:
        return await costs.optimize_itinerary_budget(
            db=db,
            current_itinerary=req.current_itinerary,
            prefs=req.preferences,
            selected_stay=req.selected_stay,
            total_budget=req.total_budget
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Budget optimization failed: {str(e)}"
        )


@router.post("/itinerary/regenerate-day", tags=["Itinerary"])
async def regenerate_itinerary_day(
    req: RegenerateDayRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Regenerate ONLY the specified day in an itinerary while preserving all other days intact.
    Supports simulate_rain DEMO flag for rain adaptation.
    """
    try:
        # Resolve stay context if stay_id or object is passed
        stay_domain = None
        if req.selected_stay:
            if isinstance(req.selected_stay, dict) and req.selected_stay.get("stay_id"):
                stay_domain = await queries.get_stay_by_id(db, req.selected_stay["stay_id"])
            elif isinstance(req.selected_stay, str):
                stay_domain = await queries.get_stay_by_id(db, req.selected_stay)

        updated_itinerary = await itinerary_service.regenerate_single_day(
            db=db,
            current_itinerary=req.current_itinerary,
            day_number=req.day_number,
            selected_stay=stay_domain,
            prefs=req.preferences,
            simulate_rain=req.simulate_rain
        )
        return {
            "itinerary": updated_itinerary,
            "regenerated_day": req.day_number,
            "rain_adapted": req.simulate_rain
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Day regeneration failed: {str(e)}"
        )

