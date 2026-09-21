import pytest
from pydantic import ValidationError
from app.models import (
    TripPreferencesRequest,
    ModifyItineraryRequest,
    PlaceDomain,
    RestaurantDomain,
    ActivityDomain,
    TravelPaceEnum,
    FoodPreferenceEnum
)


# ==========================================
# 1. TripPreferencesRequest Unit Tests
# ==========================================

def test_valid_trip_preferences_request():
    payload = {
        "destination": "Goa",
        "days": 4,
        "budget": 15000,
        "interests": ["Beaches", "Heritage", "Nightlife"],
        "travel_pace": "Balanced",
        "food_preference": "Seafood"
    }
    req = TripPreferencesRequest(**payload)
    assert req.destination == "Goa"
    assert req.days == 4
    assert req.budget == 15000.0
    assert req.interests == ["Beaches", "Heritage", "Nightlife"]
    assert req.travel_pace == TravelPaceEnum.BALANCED
    assert req.food_preference == FoodPreferenceEnum.SEAFOOD


def test_invalid_destination_empty():
    payload = {
        "destination": "   ",
        "days": 3,
        "budget": 5000,
        "interests": ["Beaches"],
        "travel_pace": "Relaxed",
        "food_preference": "Veg"
    }
    with pytest.raises(ValidationError) as exc_info:
        TripPreferencesRequest(**payload)
    assert "at least 1 character" in str(exc_info.value) or "string_too_short" in str(exc_info.value)


def test_invalid_days_negative_or_zero():
    payload = {
        "destination": "Goa",
        "days": 0,
        "budget": 5000,
        "interests": ["Beaches"],
        "travel_pace": "Relaxed",
        "food_preference": "Veg"
    }
    with pytest.raises(ValidationError) as exc_info:
        TripPreferencesRequest(**payload)
    assert "greater than 0" in str(exc_info.value)


def test_invalid_budget_negative():
    payload = {
        "destination": "Goa",
        "days": 3,
        "budget": -100,
        "interests": ["Beaches"],
        "travel_pace": "Relaxed",
        "food_preference": "Veg"
    }
    with pytest.raises(ValidationError) as exc_info:
        TripPreferencesRequest(**payload)
    assert "greater than or equal to 0" in str(exc_info.value)


def test_invalid_interests_empty_list():
    payload = {
        "destination": "Goa",
        "days": 3,
        "budget": 5000,
        "interests": [],
        "travel_pace": "Relaxed",
        "food_preference": "Veg"
    }
    with pytest.raises(ValidationError) as exc_info:
        TripPreferencesRequest(**payload)
    assert "at least 1 item" in str(exc_info.value) or "too_short" in str(exc_info.value)


def test_invalid_travel_pace_value():
    payload = {
        "destination": "Goa",
        "days": 3,
        "budget": 5000,
        "interests": ["Beaches"],
        "travel_pace": "SuperFast",  # Unsupported value
        "food_preference": "Veg"
    }
    with pytest.raises(ValidationError) as exc_info:
        TripPreferencesRequest(**payload)
    assert "Input should be 'Relaxed', 'Balanced' or 'Fast-Paced'" in str(exc_info.value)


def test_invalid_food_preference_value():
    payload = {
        "destination": "Goa",
        "days": 3,
        "budget": 5000,
        "interests": ["Beaches"],
        "travel_pace": "Relaxed",
        "food_preference": "Keto"  # Unsupported value
    }
    with pytest.raises(ValidationError) as exc_info:
        TripPreferencesRequest(**payload)
    assert "Input should be 'Veg', 'Non-Veg', 'Seafood', 'Vegan', 'Jain' or 'Any'" in str(exc_info.value)


# ==========================================
# 2. ModifyItineraryRequest Unit Tests
# ==========================================

def test_valid_modify_itinerary_request():
    payload = {
        "current_itinerary": {"destination": "Goa", "days": []},
        "user_request": "Make day 2 morning more relaxed and add seafood lunch"
    }
    req = ModifyItineraryRequest(**payload)
    assert req.user_request == "Make day 2 morning more relaxed and add seafood lunch"


def test_invalid_modify_itinerary_request_empty():
    payload = {
        "current_itinerary": {},
        "user_request": "   "
    }
    with pytest.raises(ValidationError) as exc_info:
        ModifyItineraryRequest(**payload)
    assert "at least 1 character" in str(exc_info.value) or "string_too_short" in str(exc_info.value)


# ==========================================
# 3. Domain Models Schema Preservation Tests
# ==========================================

def test_place_domain_model_parsing():
    doc = {
        "_id": "6a9da4ffbc6c5caf4aff989a",
        "place_id": "P001",
        "name": "BAGA BEACH",
        "category": "Beach",
        "description": "High-energy party beach",
        "entry_fee": 0,
        "rating": 4.5,
        "location_area": "North Goa (Bardez)",
        "latitude": 15.5553,
        "longitude": 73.7517,
        "opening_time": "0:00",
        "closing_time": "23:59",
        "min_duration_hours": 2,
        "max_duration_hours": 4
    }
    place = PlaceDomain(**doc)
    assert place.place_id == "P001"
    assert place.name == "BAGA BEACH"
    assert place.latitude == 15.5553
    assert place.longitude == 73.7517
    assert place.rating == 4.5


def test_restaurant_domain_model_parsing():
    doc = {
        "_id": "6a9da4adbc6c5caf4aff987d",
        "restaurant_id": "R001",
        "restaurant_name": "Britto’s Restaurant & Bar",
        "cuisine": "Goan; Seafood; Continental",
        "area": "Baga",
        "district": "North Goa",
        "latitude": 15.556,
        "longitude": 73.751,
        "average_cost_for_two_inr": 1800,
        "rating_value": 4.3
    }
    rest = RestaurantDomain(**doc)
    assert rest.restaurant_id == "R001"
    assert rest.restaurant_name == "Britto’s Restaurant & Bar"
    assert rest.cuisine == "Goan; Seafood; Continental"
    assert rest.average_cost_for_two_inr == 1800.0


def test_activity_domain_model_parsing():
    doc = {
        "_id": "6a9da480bc6c5caf4aff9861",
        "activity_id": "A001",
        "activity_name": "Jet Ski Ride",
        "category": "Water Sports",
        "area": "Baga",
        "district": "North Goa",
        "cost_inr": 800,
        "duration_hours": 0.25,
        "latitude": 15.5556,
        "longitude": 73.7517
    }
    act = ActivityDomain(**doc)
    assert act.activity_id == "A001"
    assert act.activity_name == "Jet Ski Ride"
    assert act.cost_inr == 800.0
    assert act.duration_hours == 0.25
