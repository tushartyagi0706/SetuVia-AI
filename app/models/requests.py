from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict


class TravelPaceEnum(str, Enum):
    RELAXED = "Relaxed"
    BALANCED = "Balanced"
    FAST_PACED = "Fast-Paced"


class FoodPreferenceEnum(str, Enum):
    VEG = "Veg"
    NON_VEG = "Non-Veg"
    SEAFOOD = "Seafood"
    VEGAN = "Vegan"
    JAIN = "Jain"
    ANY = "Any"


class SelectedStayInput(BaseModel):
    """Optional selected stay context input for Phase 2 itineraries."""
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    stay_id: str = Field(..., min_length=1, description="Unique stay ID from MongoDB stays collection")


class TripPreferencesRequest(BaseModel):
    """
    Request model for AI Trip Concierge preference validation.
    """
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    destination: str = Field(..., min_length=1, description="Destination name (e.g., Goa)")
    days: int = Field(..., gt=0, le=14, description="Number of trip days (must be a positive integer between 1 and 14)")
    budget: float = Field(..., ge=0, description="Total trip budget or daily budget cap in INR (must be non-negative)")
    interests: List[str] = Field(..., min_length=1, description="List of travel interests (e.g., Beaches, Heritage, Nightlife)")
    travel_pace: TravelPaceEnum = Field(..., description="Travel pace ('Relaxed', 'Balanced', 'Fast-Paced')")
    food_preference: FoodPreferenceEnum = Field(..., description="Food preference ('Veg', 'Non-Veg', 'Seafood', 'Vegan', 'Jain', 'Any')")
    selected_stay: Optional[SelectedStayInput] = Field(default=None, description="Optional selected stay context")

    @field_validator("destination")
    @classmethod
    def validate_destination(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Destination cannot be empty or blank")
        return v.strip()

    @field_validator("interests")
    @classmethod
    def validate_interests(cls, v: List[str]) -> List[str]:
        cleaned = [item.strip() for item in v if item and item.strip()]
        if not cleaned:
            raise ValueError("Interests list must contain at least one non-empty string")
        return cleaned


class ModifyItineraryRequest(BaseModel):
    """
    Request model for natural-language itinerary modifications.
    """
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    current_itinerary: Dict[str, Any] = Field(..., description="Existing itinerary JSON structure")
    user_request: str = Field(..., min_length=1, description="Natural language modification instruction")

    @field_validator("user_request")
    @classmethod
    def validate_request(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("User modification request cannot be empty or blank")
        return v.strip()
