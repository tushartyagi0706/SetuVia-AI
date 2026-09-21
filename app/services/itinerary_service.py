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


async def regenerate_single_day(
    db: AsyncIOMotorDatabase,
    current_itinerary: Dict[str, Any],
    day_number: int,
    selected_stay: Optional[StayDomain] = None,
    prefs: Optional[TripPreferencesRequest] = None,
    simulate_rain: bool = False
) -> Dict[str, Any]:
    """Regenerate ONLY the specified day in an itinerary using verified MongoDB candidates.

    Untouched days remain completely unchanged.
    If simulate_rain is True, outdoor POIs are adapted to verified indoor candidates.
    """
    import copy
    import re
    from app.engine.scoring import generate_why_recommended_explanation

    updated = copy.deepcopy(current_itinerary)
    days = updated.get("days") or updated.get("days_plan") or []

    target_idx = -1
    for idx, d in enumerate(days):
        d_num = d.get("day") if isinstance(d, dict) else getattr(d, "day", idx + 1)
        if d_num == day_number:
            target_idx = idx
            break

    if target_idx == -1:
        if 1 <= day_number <= len(days):
            target_idx = day_number - 1
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Day number {day_number} is out of bounds for itinerary with {len(days)} days."
            )

    # Query verified candidates from MongoDB Atlas
    places = await queries.get_all_places(db)
    restaurants = await queries.get_all_restaurants(db)
    activities = await queries.get_all_activities(db)
    all_candidates = data_adapter.normalize_candidates(places, restaurants, activities)

    # Filter for rain adaptation if simulate_rain is true
    if simulate_rain:
        logger.info(f"Applying Rain Adaptation for Day {day_number}")
        rain_pattern = re.compile(r"beach|water|outdoor|viewpoint|fort|park", re.IGNORECASE)
        indoor_candidates = [
            c for c in all_candidates
            if not rain_pattern.search(f"{c.category} {c.name}")
        ]
        if indoor_candidates:
            all_candidates = indoor_candidates

    # Sort candidates by proximity to stay if stay anchor exists
    base_stay = selected_stay
    if not base_stay and isinstance(updated.get("selected_stay"), dict):
        base_stay = stay.normalize_stay(updated.get("selected_stay"))

    if base_stay and base_stay.latitude and base_stay.longitude:
        all_candidates.sort(
            key=lambda c: stay.get_stay_distance_to_candidate(base_stay, c)
        )

    places_pool = [c for c in all_candidates if c.item_type == "place"]
    restaurants_pool = [c for c in all_candidates if c.item_type == "restaurant"]
    activities_pool = [c for c in all_candidates if c.item_type == "activity"]

    # Build fresh slots for the regenerated day (offset candidates by day_number to avoid duplicate picks)
    offset = (day_number * 3) % max(1, len(places_pool))
    m_place = places_pool[(offset) % len(places_pool)] if places_pool else None
    e_place = places_pool[(offset + 1) % len(places_pool)] if len(places_pool) > 1 else m_place

    r_offset = (day_number * 2) % max(1, len(restaurants_pool))
    l_rest = restaurants_pool[r_offset % len(restaurants_pool)] if restaurants_pool else None

    a_offset = (day_number * 2) % max(1, len(activities_pool))
    a_act = activities_pool[a_offset % len(activities_pool)] if activities_pool else None

    new_slots = []
    slots_spec = [
        ("Morning", "place", m_place, "Explore morning cultural highlights."),
        ("Lunch", "restaurant", l_rest, "Enjoy authentic regional cuisine."),
        ("Afternoon", "activity", a_act, "Participate in local experiences."),
        ("Evening", "place", e_place, "Relax with evening sunset views.")
    ]

    for slot_name, item_type, cand, tip in slots_spec:
        if not cand:
            continue

        exp = generate_why_recommended_explanation(cand, prefs, base_stay)
        why_rec = {
            "distance_from_stay_km": exp["distance_from_stay_km"],
            "interest_match": exp["interest_match"],
            "budget_suitability": exp["budget_suitability"],
            "pace_suitability": exp["pace_suitability"],
            "reasons": exp["reasons"]
        }
        primary_reason = exp["reasons"][0] if exp["reasons"] else "Recommended for your day"

        slot_dict = {
            "slot": slot_name,
            "item_type": item_type,
            "item_id": cand.item_id,
            "name": cand.name,
            "category": cand.category,
            "estimated_duration_hours": 1.5 if item_type == "restaurant" else 2.0,
            "estimated_cost_inr": cand.cost,
            "location_area": cand.details.get("location_area") or cand.details.get("area") or "Goa",
            "latitude": cand.latitude,
            "longitude": cand.longitude,
            "notes_or_tips": tip if not simulate_rain else f"{tip} (Indoor rain-adapted)",
            "image_url": cand.details.get("image_url") or cand.details.get("image"),
            "image_source": cand.details.get("image_source"),
            "distance_from_stay_km": exp["distance_from_stay_km"],
            "recommendation_reason": primary_reason,
            "reasons": exp["reasons"],
            "why_recommended": why_rec
        }
        new_slots.append(slot_dict)

    title_suffix = " (Rain-Adapted)" if simulate_rain else ""
    target_area = new_slots[0]["location_area"] if new_slots else "Goa"

    regenerated_day = {
        "day": day_number,
        "title": f"Day {day_number} - {target_area} Highlights{title_suffix}",
        "area_cluster": f"{target_area} Cluster",
        "slots": new_slots,
        "items": new_slots
    }

    # Re-insert regenerated day into days array preserving all other days untouched
    if isinstance(updated.get("days"), list):
        updated["days"][target_idx] = regenerated_day
    if isinstance(updated.get("days_plan"), list):
        updated["days_plan"][target_idx] = regenerated_day

    return updated

