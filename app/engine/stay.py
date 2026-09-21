from typing import Optional, Dict, Any
from app.models.domain import StayDomain
from app.models.responses import CandidateItem
from app.engine.distance import haversine_distance_km


def normalize_stay(stay_data: Dict[str, Any]) -> Optional[StayDomain]:
    """Normalize raw stay dictionary into StayDomain model."""
    if not stay_data or not isinstance(stay_data, dict):
        return None

    try:
        return StayDomain(**stay_data)
    except Exception:
        return None


def validate_stay_id(stay: Optional[StayDomain]) -> bool:
    """Validate that stay instance exists and has a non-empty stay_id."""
    if not stay or not stay.stay_id or not stay.stay_id.strip():
        return False
    return True


def validate_stay_coordinates(stay: Optional[StayDomain]) -> bool:
    """Validate that stay instance has valid numeric latitude and longitude."""
    if not stay:
        return False
    if stay.latitude is None or stay.longitude is None:
        return False
    if not (-90.0 <= stay.latitude <= 90.0 and -180.0 <= stay.longitude <= 180.0):
        return False
    return True


def get_stay_distance_to_candidate(
    stay: Optional[StayDomain],
    candidate: CandidateItem
) -> float:
    """Calculate distance in km from selected stay to candidate POI.

    Returns float distance in km, or float('inf') if coordinates are missing.
    """
    if not validate_stay_coordinates(stay):
        return float('inf')

    return haversine_distance_km(
        candidate.latitude,
        candidate.longitude,
        stay.latitude,
        stay.longitude
    )
