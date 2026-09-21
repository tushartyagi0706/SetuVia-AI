from typing import List, Optional
from app.models.requests import TripPreferencesRequest
from app.models.responses import CandidateItem
from app.models.domain import StayDomain
from app.engine.distance import haversine_distance_km
from app.engine.scoring import score_candidate_poi


def score_candidate(
    candidate: CandidateItem,
    prefs: TripPreferencesRequest,
    selected_stay: Optional[StayDomain] = None
) -> float:
    """Calculate recommendation score for a candidate item."""
    return score_candidate_poi(candidate, prefs, selected_stay=selected_stay)


def filter_and_rank_candidates(
    candidates: List[CandidateItem],
    prefs: TripPreferencesRequest,
    selected_stay: Optional[StayDomain] = None
) -> List[CandidateItem]:
    """Score, rank, and sort candidates by recommendation score descending."""
    scored: List[CandidateItem] = []
    for item in candidates:
        item.score = score_candidate(item, prefs, selected_stay=selected_stay)
        scored.append(item)

    scored.sort(key=lambda x: x.score, reverse=True)
    return scored
