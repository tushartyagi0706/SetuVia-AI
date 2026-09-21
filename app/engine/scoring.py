from typing import Optional
from app.models.requests import TripPreferencesRequest, FoodPreferenceEnum
from app.models.responses import CandidateItem
from app.models.domain import StayDomain
from app.engine.stay import get_stay_distance_to_candidate


def score_candidate_poi(
    candidate: CandidateItem,
    prefs: TripPreferencesRequest,
    selected_stay: Optional[StayDomain] = None
) -> float:
    """Calculate deterministic recommendation score for a candidate POI.

    Combines interest match, food preference match, rating weighting,
    budget constraint, and stay proximity boost with full null safety.
    """
    score = 50.0

    # 1. Interest Matching (+24 pts)
    if prefs.interests:
        user_interests_lower = [i.lower() for i in prefs.interests]
        cat_lower = (candidate.category or "").lower()
        if any(interest in cat_lower or cat_lower in interest for interest in user_interests_lower):
            score += 24.0

    # 2. Diet Matching for Restaurants (+14 pts)
    if candidate.item_type == "restaurant":
        cuisine = (candidate.category or "").lower()
        pref = prefs.food_preference
        if pref == FoodPreferenceEnum.VEG and ("veg" in cuisine or "pure" in cuisine):
            score += 14.0
        elif pref == FoodPreferenceEnum.SEAFOOD and "seafood" in cuisine:
            score += 14.0
        elif pref == FoodPreferenceEnum.JAIN and "jain" in cuisine:
            score += 14.0
        elif pref == FoodPreferenceEnum.VEGAN and "vegan" in cuisine:
            score += 14.0
        elif pref == FoodPreferenceEnum.ANY:
            score += 10.0

    # 3. Rating Weighting (+ rating * 5)
    safe_rating = candidate.rating if candidate.rating is not None else 4.0
    score += safe_rating * 5.0

    # 4. Budget Constraint Penalty
    safe_days = max(1, prefs.days)
    daily_budget = prefs.budget / float(safe_days)
    safe_cost = candidate.cost if candidate.cost is not None else 0.0
    if safe_cost > daily_budget * 0.4:
        score -= 15.0

    # 5. Stay Proximity Boost (if selected stay is provided and has valid coordinates)
    if selected_stay and selected_stay.latitude is not None and selected_stay.longitude is not None:
        dist = get_stay_distance_to_candidate(selected_stay, candidate)
        if dist <= 5.0:
            score += 15.0
        elif dist <= 15.0:
            score += 8.0
        elif dist <= 25.0:
            score += 3.0

    return round(score, 2)
