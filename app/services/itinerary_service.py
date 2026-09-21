import logging
from typing import List, Dict, Any, Tuple, Optional
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db import queries
from app.engine import data_adapter, recommendation, itinerary, llm, modify_itinerary, stay
from app.models.requests import TripPreferencesRequest
from app.models.responses import ItineraryResponse
from app.models.domain import StayDomain

logger = logging.getLogger("setuvia.services.itinerary")


async def generate_full_itinerary(
    db: AsyncIOMotorDatabase,
    prefs: TripPreferencesRequest
) -> ItineraryResponse:
    """Orchestrate live database candidate queries, stay validation, recommendation scoring, and Gemini AI itinerary generation."""
    logger.info(f"Generating full itinerary for destination: {prefs.destination}")

    # 1. Stay Validation (if selected_stay is provided)
    selected_stay: Optional[StayDomain] = None
    if prefs.selected_stay and prefs.selected_stay.stay_id:
        stay_id = prefs.selected_stay.stay_id
        selected_stay = await queries.get_stay_by_id(db, stay_id)
        if not selected_stay:
            logger.warning(f"Validation failed: Stay ID '{stay_id}' not found in MongoDB stays collection.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Selected stay with ID '{stay_id}' was not found in verified stays."
            )
        logger.info(f"Verified selected stay context: {selected_stay.stay_name} ({selected_stay.stay_id})")

    # 2. Query verified records from MongoDB Atlas
    places = await queries.get_all_places(db)
    restaurants = await queries.get_all_restaurants(db)
    activities = await queries.get_all_activities(db)

    # 3. Normalize & Rank Candidates (with optional Stay Proximity boost)
    all_candidates = data_adapter.normalize_candidates(places, restaurants, activities)
    ranked_candidates = recommendation.filter_and_rank_candidates(
        all_candidates, prefs, selected_stay=selected_stay
    )

    # 4. Attempt Grounded Gemini AI Generation
    ai_itinerary = await llm.generate_grounded_itinerary_with_gemini(
        ranked_candidates, prefs, selected_stay=selected_stay
    )
    if ai_itinerary:
        logger.info("Successfully generated itinerary via Grounded Gemini AI model")
        return ai_itinerary

    # 5. Fallback to Deterministic Smart Scheduler if Gemini is unavailable
    logger.info("Using Deterministic Smart Scheduler fallback")
    return itinerary.build_deterministic_itinerary(ranked_candidates, prefs, selected_stay=selected_stay)


async def modify_existing_itinerary(
    current_itinerary: Dict[str, Any],
    user_request: str
) -> Tuple[Dict[str, Any], str]:
    """Process chat modification request on current itinerary."""
    return await modify_itinerary.modify_itinerary_with_gemini(current_itinerary, user_request)
