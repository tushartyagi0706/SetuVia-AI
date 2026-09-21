from typing import List, Dict, Any, Optional
from app.models.requests import TripPreferencesRequest, TravelPaceEnum
from app.models.responses import CandidateItem, TimeSlotItem, ItineraryDay, ItineraryResponse
from app.models.domain import StayDomain
from app.engine.distance import haversine_distance_km
from app.engine.costs import calculate_slot_cost, compute_itinerary_cost_breakdown


def build_deterministic_itinerary(
    scored_candidates: List[CandidateItem],
    prefs: TripPreferencesRequest,
    selected_stay: Optional[StayDomain] = None
) -> ItineraryResponse:
    """Build a deterministic structured itinerary using scored candidates and geographic sequencing.

    If selected_stay is provided, its area and coordinates serve as the base anchor location.
    """
    places = [c for c in scored_candidates if c.item_type == "place"]
    restaurants = [c for c in scored_candidates if c.item_type == "restaurant"]
    activities = [c for c in scored_candidates if c.item_type == "activity"]

    base_lat = selected_stay.latitude if selected_stay and selected_stay.latitude is not None else None
    base_lon = selected_stay.longitude if selected_stay and selected_stay.longitude is not None else None
    base_area = selected_stay.area if selected_stay and selected_stay.area else "Goa"

    # Sort candidates by proximity to stay if stay coordinates exist
    if base_lat is not None and base_lon is not None:
        places.sort(
            key=lambda x: haversine_distance_km(x.latitude, x.longitude, base_lat, base_lon)
        )
        restaurants.sort(
            key=lambda x: haversine_distance_km(x.latitude, x.longitude, base_lat, base_lon)
        )
        activities.sort(
            key=lambda x: haversine_distance_km(x.latitude, x.longitude, base_lat, base_lon)
        )

    days: List[ItineraryDay] = []
    p_idx, r_idx, a_idx = 0, 0, 0
    all_slots: List[TimeSlotItem] = []

    slots_per_day = 3 if prefs.travel_pace == TravelPaceEnum.RELAXED else 4

    for d in range(1, prefs.days + 1):
        day_slots: List[TimeSlotItem] = []

        # 1. Morning Spot (Place)
        if p_idx < len(places):
            p = places[p_idx]
            p_idx += 1
            slot_cost = calculate_slot_cost("place", p.cost, 1)
            slot_item = TimeSlotItem(
                slot="Morning",
                item_type="place",
                item_id=p.item_id,
                name=p.name,
                category=p.category,
                estimated_duration_hours=2.0,
                estimated_cost_inr=slot_cost,
                location_area=p.details.get("location_area") or p.details.get("area") or base_area,
                latitude=p.latitude,
                longitude=p.longitude,
                notes_or_tips="Explore during cool morning hours.",
                image_url=p.details.get("image_url") or p.details.get("image"),
                image_source=p.details.get("image_source")
            )
            day_slots.append(slot_item)
            all_slots.append(slot_item)

        # 2. Lunch Spot (Restaurant)
        if r_idx < len(restaurants):
            r = restaurants[r_idx]
            r_idx += 1
            slot_cost = calculate_slot_cost("restaurant", r.cost, 1)
            slot_item = TimeSlotItem(
                slot="Lunch",
                item_type="restaurant",
                item_id=r.item_id,
                name=r.name,
                category=r.category,
                estimated_duration_hours=1.5,
                estimated_cost_inr=slot_cost,
                location_area=r.details.get("area") or base_area,
                latitude=r.latitude,
                longitude=r.longitude,
                notes_or_tips="Enjoy local authentic cuisine.",
                image_url=r.details.get("image_url") or r.details.get("image"),
                image_source=r.details.get("image_source")
            )
            day_slots.append(slot_item)
            all_slots.append(slot_item)

        # 3. Afternoon Spot (Activity)
        if a_idx < len(activities):
            a = activities[a_idx]
            a_idx += 1
            slot_cost = calculate_slot_cost("activity", a.cost, 1)
            duration = float(a.details.get("duration_hours") or 1.5)
            slot_item = TimeSlotItem(
                slot="Afternoon",
                item_type="activity",
                item_id=a.item_id,
                name=a.name,
                category=a.category,
                estimated_duration_hours=duration,
                estimated_cost_inr=slot_cost,
                location_area=a.details.get("area") or base_area,
                latitude=a.latitude,
                longitude=a.longitude,
                notes_or_tips="Participate in coastal activities.",
                image_url=a.details.get("image_url") or a.details.get("image"),
                image_source=a.details.get("image_source")
            )
            day_slots.append(slot_item)
            all_slots.append(slot_item)

        # 4. Evening Spot (Place, if not relaxed pace)
        if slots_per_day > 3 and p_idx < len(places):
            p = places[p_idx]
            p_idx += 1
            slot_cost = calculate_slot_cost("place", p.cost, 1)
            slot_item = TimeSlotItem(
                slot="Evening",
                item_type="place",
                item_id=p.item_id,
                name=p.name,
                category=p.category,
                estimated_duration_hours=2.0,
                estimated_cost_inr=slot_cost,
                location_area=p.details.get("location_area") or p.details.get("area") or base_area,
                latitude=p.latitude,
                longitude=p.longitude,
                notes_or_tips="Relax and enjoy sunset views.",
                image_url=p.details.get("image_url") or p.details.get("image"),
                image_source=p.details.get("image_source")
            )
            day_slots.append(slot_item)
            all_slots.append(slot_item)

        day_area = day_slots[0].location_area if day_slots else base_area
        days.append(
            ItineraryDay(
                day=d,
                title=f"Day {d} - {day_area} & Coastal Highlights",
                area_cluster=f"{day_area} Cluster",
                slots=day_slots
            )
        )

    cost_info = compute_itinerary_cost_breakdown(all_slots, 1)
    total_cost = cost_info["estimated_total_cost_inr"]

    stay_note = f" centered around stay in {base_area}" if selected_stay else ""

    return ItineraryResponse(
        destination=prefs.destination,
        total_days=prefs.days,
        total_estimated_cost_inr=total_cost,
        narrative_summary=f"A personalized {prefs.travel_pace.value.lower()} {prefs.days}-day itinerary in Goa{stay_note}.",
        days=days
    )
