from typing import List, Dict, Any, Optional
from app.models.domain import PlaceDomain, RestaurantDomain, ActivityDomain, StayDomain
from app.models.responses import CandidateItem


def normalize_candidates(
    places: List[PlaceDomain],
    restaurants: List[RestaurantDomain],
    activities: List[ActivityDomain]
) -> List[CandidateItem]:
    """Normalize MongoDB domain models into unified CandidateItem structures for AI engine processing."""
    candidates: List[CandidateItem] = []

    for p in places:
        cost_val = p.entry_fee if p.entry_fee is not None and p.entry_fee >= 0 else 0.0
        rating_val = p.rating if p.rating is not None and p.rating >= 0 else 4.0
        candidates.append(
            CandidateItem(
                item_type="place",
                item_id=p.place_id,
                name=p.name,
                category=p.category or "Attraction",
                latitude=p.latitude,
                longitude=p.longitude,
                rating=rating_val,
                cost=cost_val,
                details=p.model_dump()
            )
        )

    for r in restaurants:
        avg_cost_for_two = r.average_cost_for_two_inr if r.average_cost_for_two_inr is not None and r.average_cost_for_two_inr >= 0 else 500.0
        per_person_cost = avg_cost_for_two / 2.0
        rating_val = r.rating_value if r.rating_value is not None and r.rating_value >= 0 else 4.2
        candidates.append(
            CandidateItem(
                item_type="restaurant",
                item_id=r.restaurant_id,
                name=r.restaurant_name,
                category=r.cuisine or "Goan",
                latitude=r.latitude,
                longitude=r.longitude,
                rating=rating_val,
                cost=per_person_cost,
                details=r.model_dump()
            )
        )

    for a in activities:
        cost_val = a.cost_inr if a.cost_inr is not None and a.cost_inr >= 0 else 0.0
        candidates.append(
            CandidateItem(
                item_type="activity",
                item_id=a.activity_id,
                name=a.activity_name,
                category=a.category or "Activity",
                latitude=a.latitude,
                longitude=a.longitude,
                rating=4.5,
                cost=cost_val,
                details=a.model_dump()
            )
        )

    return candidates


def filter_top_bounded_candidates(
    candidates: List[CandidateItem],
    max_total: int = 20
) -> List[CandidateItem]:
    """Select a bounded candidate set (~15-25 candidates) maintaining balanced category distribution."""
    places = [c for c in candidates if c.item_type == "place"]
    restaurants = [c for c in candidates if c.item_type == "restaurant"]
    activities = [c for c in candidates if c.item_type == "activity"]

    # Select top items per category
    top_places = places[:10]
    top_restaurants = restaurants[:5]
    top_activities = activities[:5]

    bounded = top_places + top_restaurants + top_activities
    return bounded[:max_total]
