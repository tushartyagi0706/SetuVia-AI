from typing import List, Dict, Any, Optional
from app.models.responses import CandidateItem, TimeSlotItem, ItineraryResponse


def calculate_slot_cost(
    item_type: str,
    base_cost: Optional[float],
    travelers_count: int = 1
) -> float:
    """Calculate normalized cost for an itinerary slot based on item type and traveler count.

    Avoids negative costs and safely handles null/missing values.
    """
    if base_cost is None or base_cost < 0:
        clean_base = 0.0
    else:
        clean_base = float(base_cost)

    # Places entry fee per person
    if item_type == "place":
        return round(clean_base * max(1, travelers_count), 2)

    # Restaurant cost (base_cost is per-person estimate derived from avg for 2)
    elif item_type == "restaurant":
        return round(clean_base * max(1, travelers_count), 2)

    # Activity cost per person
    elif item_type == "activity":
        return round(clean_base * max(1, travelers_count), 2)

    return round(clean_base, 2)


def compute_itinerary_cost_breakdown(
    slots: List[TimeSlotItem],
    travelers_count: int = 1
) -> Dict[str, float]:
    """Calculate cost breakdown across places, restaurants, and activities."""
    places_total = 0.0
    restaurants_total = 0.0
    activities_total = 0.0

    for slot in slots:
        cost = max(0.0, slot.estimated_cost_inr)
        if slot.item_type == "place":
            places_total += cost
        elif slot.item_type == "restaurant":
            restaurants_total += cost
        elif slot.item_type == "activity":
            activities_total += cost

    grand_total = places_total + restaurants_total + activities_total

    return {
        "places_total_inr": round(places_total, 2),
        "restaurants_total_inr": round(restaurants_total, 2),
        "activities_total_inr": round(activities_total, 2),
        "estimated_total_cost_inr": round(grand_total, 2)
    }


def reconcile_budget(
    total_estimated_cost: float,
    user_budget: float
) -> Dict[str, Any]:
    """Check if estimated total cost is within user budget constraints."""
    within_budget = total_estimated_cost <= user_budget
    difference = user_budget - total_estimated_cost

    return {
        "user_budget_inr": round(user_budget, 2),
        "total_estimated_cost_inr": round(total_estimated_cost, 2),
        "within_budget": within_budget,
        "remaining_budget_inr": round(difference, 2) if within_budget else 0.0,
        "exceeded_by_inr": round(abs(difference), 2) if not within_budget else 0.0
    }
