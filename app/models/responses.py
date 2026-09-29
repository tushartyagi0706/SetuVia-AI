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


class WhyRecommended(BaseModel):
    """Structured recommendation explanation based on actual backend scoring."""
    distance_from_stay_km: Optional[float] = None
    interest_match: Optional[str] = None
    budget_suitability: Optional[str] = None
    pace_suitability: Optional[str] = None
    reasons: List[str] = Field(default_factory=list)


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
    distance_from_stay_km: Optional[float] = None
    recommendation_reason: Optional[str] = None
    reasons: List[str] = Field(default_factory=list)
    why_recommended: Optional[WhyRecommended] = None


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


class BudgetBreakdown(BaseModel):
    """Itemized budget breakdown by expense category."""
    stay: Optional[float] = Field(default=None, description="Accommodation cost (null when unverified in database)")
    food: float = Field(0.0, description="Dining expenses in INR")
    activities: float = Field(0.0, description="Activities and entry fees in INR")
    transport: float = Field(0.0, description="Transportation expenses in INR")


class TransparentBudgetResponse(BaseModel):
    """Transparent trip budget summary response."""
    total_budget: float
    planned_amount: float
    remaining_amount: float
    is_over_budget: bool
    breakdown: BudgetBreakdown


class OptimizeBudgetResponse(BaseModel):
    """Result of automated budget optimization."""
    optimized_itinerary: Dict[str, Any]
    original_cost: float
    optimized_cost: float
    savings: float
    changes_made: List[str] = Field(default_factory=list)
    remaining_budget: float
    is_over_budget: bool


class AskSetuChatResponse(BaseModel):
    """Structured response model for Ask Setu travel concierge."""
    reply: str
    intent: Optional[str] = Field(default="general_travel_query", description="Detected user intent")
    itinerary_modified: bool = Field(default=False, description="True ONLY if itinerary was actually modified")
    modified_itinerary: Optional[Dict[str, Any]] = Field(default=None, description="Updated itinerary if modified")
    suggestions: List[str] = Field(default_factory=list)
    context_used: Dict[str, bool] = Field(default_factory=dict)


class TrustEvidenceResponse(BaseModel):
    """Structured Trust Evidence model for selected stay verification."""
    stay_id: str
    stay_name: str
    data_source: Optional[str] = None
    data_quality_flag: Optional[str] = None
    last_checked_at: Optional[Any] = None
    official_website: Optional[str] = None
    booking_url: Optional[str] = None
    rating: float = 0.0
    review_count: int = 0

