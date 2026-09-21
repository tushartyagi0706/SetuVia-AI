import math
from typing import Optional


def haversine_distance_km(
    lat1: Optional[float],
    lon1: Optional[float],
    lat2: Optional[float],
    lon2: Optional[float]
) -> float:
    """Calculate Haversine distance in km between two lat/lon coordinates.

    Returns float distance in km, or float('inf') if any coordinate is None.
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return float('inf')

    r = 6371.0  # Earth's mean radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c
