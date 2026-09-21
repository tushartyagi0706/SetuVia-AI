from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.models.domain import PlaceDomain, RestaurantDomain, ActivityDomain


class CandidateItem(BaseModel):
    """Candidate POI item wrapper with score and distance metadata."""
    item_type: str = Field(..., description="'place', 'restaurant', or 'activity'")
    item_id: str
    name: str
    category: str
    latitude: float
    longitude: float
    rating: float = 0.0
    cost: float = 0.0
    score: float = 0.0
    details: Dict[str, Any] = Field(default_factory=dict)


class RecommendationCandidatesResponse(BaseModel):
    """Response model containing candidate pools pre-filtered by the recommendation engine."""
    total_candidates: int
    places: List[PlaceDomain] = Field(default_factory=list)
    restaurants: List[RestaurantDomain] = Field(default_factory=list)
    activities: List[ActivityDomain] = Field(default_factory=list)


class TimeSlotItem(BaseModel):
    """An individual item scheduled inside a day time slot."""
    slot: str = Field(..., description="'Morning', 'Lunch', 'Afternoon', 'Evening', 'Dinner'")
    item_type: str = Field(..., description="'place', 'restaurant', or 'activity'")
    item_id: str
    name: str
    category: str
    estimated_duration_hours: float = 1.0
    estimated_cost_inr: float = 0.0
    location_area: Optional[str] = None
    latitude: float
    longitude: float
    notes_or_tips: Optional[str] = None
    image_url: Optional[str] = None
    image_source: Optional[str] = None
    image: Optional[str] = None


class ItineraryDay(BaseModel):
    """Daily timeline structure."""
    day: int
    title: str
    area_cluster: Optional[str] = None
    slots: List[TimeSlotItem] = Field(default_factory=list)


class ItineraryResponse(BaseModel):
    """Structured response model for generated or modified trip itineraries."""
    destination: str
    total_days: int
    total_estimated_cost_inr: float
    narrative_summary: str
    days: List[ItineraryDay]
    modification_diff: Optional[str] = None
