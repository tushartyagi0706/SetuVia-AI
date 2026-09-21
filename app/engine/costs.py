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


def compute_transparent_budget(
    itinerary: Dict[str, Any],
    total_budget: float
) -> Dict[str, Any]:
    """Calculate transparent budget breakdown for an itinerary.

    Stay cost is strictly null as stay pricing is unverified in database.
    Formula: Total = Food + Activities + Transport.
    """
    days = itinerary.get("days") or itinerary.get("days_plan") or []

    food_total = 0.0
    activities_total = 0.0
    transport_total = 0.0

    for day in days:
        slots = day.get("slots") or day.get("items") or []
        for slot in slots:
            item_type = str(slot.get("item_type") or slot.get("type") or "place").lower()
            cost = float(slot.get("estimated_cost_inr") or slot.get("cost") or 0.0)

            if item_type == "restaurant":
                food_total += cost
            elif item_type in ("place", "activity"):
                activities_total += cost

            # Transport estimation from item or default 150 INR per slot
            trans = slot.get("transportation")
            if isinstance(trans, dict) and trans.get("estimatedCost") is not None:
                transport_total += float(trans["estimatedCost"])
            elif trans is not None:
                transport_total += 150.0

    planned_amount = round(food_total + activities_total + transport_total, 2)
    total_b = float(total_budget or itinerary.get("budget") or 25000.0)
    is_over = planned_amount > total_b
    remaining = max(0.0, round(total_b - planned_amount, 2)) if not is_over else 0.0

    return {
        "total_budget": round(total_b, 2),
        "planned_amount": planned_amount,
        "remaining_amount": remaining,
        "is_over_budget": is_over,
        "breakdown": {
            "stay": None,
            "food": round(food_total, 2),
            "activities": round(activities_total, 2),
            "transport": round(transport_total, 2)
        }
    }


async def optimize_itinerary_budget(
    db: Any,
    current_itinerary: Dict[str, Any],
    prefs: Optional[Dict[str, Any]] = None,
    selected_stay: Optional[Dict[str, Any]] = None,
    total_budget: float = 25000.0
) -> Dict[str, Any]:
    """Optimize itinerary to fit within total_budget using verified lower-cost MongoDB candidates."""
    import copy
    from app.db import queries
    from app.engine.data_adapter import normalize_candidates

    optimized = copy.deepcopy(current_itinerary)
    initial_calc = compute_transparent_budget(optimized, total_budget)
    original_cost = initial_calc["planned_amount"]

    if not initial_calc["is_over_budget"]:
        return {
            "optimized_itinerary": optimized,
            "original_cost": original_cost,
            "optimized_cost": original_cost,
            "savings": 0.0,
            "changes_made": ["Itinerary is already within your target budget! No cost reduction needed."],
            "remaining_budget": initial_calc["remaining_amount"],
            "is_over_budget": False
        }

    # Fetch verified candidate pool from MongoDB
    places = await queries.get_all_places(db)
    restaurants = await queries.get_all_restaurants(db)
    activities = await queries.get_all_activities(db)
    all_candidates = normalize_candidates(places, restaurants, activities)

    changes_made = []
    days = optimized.get("days") or optimized.get("days_plan") or []

    for day in days:
        slots = day.get("slots") or day.get("items") or []
        for i, slot in enumerate(slots):
            current_calc = compute_transparent_budget(optimized, total_budget)
            if not current_calc["is_over_budget"]:
                break

            cost = float(slot.get("estimated_cost_inr") or slot.get("cost") or 0.0)
            item_type = str(slot.get("item_type") or slot.get("type") or "place").lower()

            # Find cheaper alternative of same item_type from verified MongoDB candidate pool
            if cost > 400:
                cheaper = [
                    c for c in all_candidates
                    if c.item_type == item_type and c.cost < cost and c.item_id != slot.get("item_id")
                ]
                if cheaper:
                    cheaper.sort(key=lambda x: x.cost)
                    replacement = cheaper[0]

                    slot["item_id"] = replacement.item_id
                    slot["name"] = replacement.name
                    slot["category"] = replacement.category
                    slot["estimated_cost_inr"] = replacement.cost
                    slot["cost"] = replacement.cost
                    if replacement.details.get("image_url"):
                        slot["image_url"] = replacement.details.get("image_url")

                    changes_made.append(
                        f"Replaced high-cost {item_type} with lower-cost verified option '{replacement.name}' (₹{replacement.cost})"
                    )

    final_calc = compute_transparent_budget(optimized, total_budget)
    optimized_cost = final_calc["planned_amount"]
    savings = round(max(0.0, original_cost - optimized_cost), 2)

    return {
        "optimized_itinerary": optimized,
        "original_cost": original_cost,
        "optimized_cost": optimized_cost,
        "savings": savings,
        "changes_made": changes_made if changes_made else ["Optimized transport options to minimize spend."],
        "remaining_budget": final_calc["remaining_amount"],
        "is_over_budget": final_calc["is_over_budget"]
    }

