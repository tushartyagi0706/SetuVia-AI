from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict


class PlaceDomain(BaseModel):
    """Domain model matching the exact schema of the 'places' MongoDB collection."""
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    place_id: str
    name: str
    category: str
    description: Optional[str] = None
    entry_fee: float = 0.0
    rating: float = 0.0
    location_area: Optional[str] = None
    latitude: float
    longitude: float
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    restrictions: Optional[str] = None
    best_time_to_visit: Optional[str] = None
    best_season_to_visit: Optional[str] = None
    min_duration_hours: Optional[float] = None
    max_duration_hours: Optional[float] = None
    image_url: Optional[str] = None
    image_source: Optional[str] = None
    image: Optional[str] = None


class RestaurantDomain(BaseModel):
    """Domain model matching the exact schema of the 'restaurants' MongoDB collection."""
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    restaurant_id: str
    restaurant_name: str
    cuisine: str
    area: Optional[str] = None
    district: Optional[str] = None
    latitude: float
    longitude: float
    coordinate_accuracy: Optional[str] = None
    average_cost_for_two_inr: float = 0.0
    rating_value: float = 0.0
    rating_source: Optional[str] = None
    cost_source: Optional[str] = None
    official_website: Optional[str] = None
    data_quality_flag: Optional[str] = None
    last_checked_at: Optional[Any] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None
    image_source: Optional[str] = None
    image: Optional[str] = None


class ActivityDomain(BaseModel):
    """Domain model matching the exact schema of the 'activities' MongoDB collection."""
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    activity_id: str
    activity_name: str
    category: str
    area: Optional[str] = None
    district: Optional[str] = None
    cost_inr: float = 0.0
    cost_basis: Optional[str] = None
    duration_hours: float = 1.0
    latitude: float
    longitude: float
    location_precision: Optional[str] = None
    data_source: Optional[str] = None
    data_quality_flag: Optional[str] = None
    last_checked_at: Optional[Any] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None
    image_source: Optional[str] = None
    image: Optional[str] = None


class StayDomain(BaseModel):
    """Domain model matching the exact schema of the 'stays' MongoDB collection."""
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    stay_id: str
    stay_name: str
    stay_type: str
    area: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    image_source: Optional[str] = None
    rating: float = 0.0
    review_count: int = 0
    official_website: Optional[str] = None
    booking_url: Optional[str] = None
    data_source: Optional[str] = None
    last_checked_at: Optional[Any] = None
    data_quality_flag: Optional[str] = None

