import pytest
from app.models.domain import StayDomain, PlaceDomain, RestaurantDomain, ActivityDomain
from app.models.requests import TripPreferencesRequest, SelectedStayInput, TravelPaceEnum, FoodPreferenceEnum
from app.models.responses import CandidateItem
from app.engine import distance, stay, scoring, recommendation, costs, itinerary, llm, data_adapter


# ==========================================
# 1. StayDomain Model Parsing Test
# ==========================================
def test_stay_domain_model_parsing():
    doc = {
        "_id": "60d5ec49f1b2c82d88888888",
        "stay_id": "GOA-STAY-001",
        "stay_name": "Taj Exotica Resort & Spa",
        "stay_type": "Resort",
        "area": "Benaulim",
        "district": "South Goa",
        "latitude": 15.2447,
        "longitude": 73.9168,
        "image_url": "https://example.com/taj.jpg",
        "rating": 4.8,
        "review_count": 1250,
        "official_website": "https://tajhotels.com",
        "booking_url": "https://booking.com/taj",
        "data_source": "Verified Partner",
        "data_quality_flag": "HIGH"
    }
    s = StayDomain(**doc)
    assert s.stay_id == "GOA-STAY-001"
    assert s.stay_name == "Taj Exotica Resort & Spa"
    assert s.stay_type == "Resort"
    assert s.latitude == 15.2447
    assert s.longitude == 73.9168
    assert s.rating == 4.8
    assert s.review_count == 1250


# ==========================================
# 2. TripPreferencesRequest with Selected Stay
# ==========================================
def test_trip_preferences_with_selected_stay():
    payload = {
        "destination": "Goa",
        "days": 3,
        "budget": 20000,
        "interests": ["Beaches", "Nature"],
        "travel_pace": "Balanced",
        "food_preference": "Any",
        "selected_stay": {
            "stay_id": "GOA-STAY-001"
        }
    }
    req = TripPreferencesRequest(**payload)
    assert req.destination == "Goa"
    assert req.selected_stay is not None
    assert req.selected_stay.stay_id == "GOA-STAY-001"


# ==========================================
# 3. TripPreferencesRequest without Selected Stay (Phase 1 Compatibility)
# ==========================================
def test_trip_preferences_without_selected_stay_phase1_compat():
    payload = {
        "destination": "Goa",
        "days": 3,
        "budget": 20000,
        "interests": ["Beaches"],
        "travel_pace": "Relaxed",
        "food_preference": "Veg"
    }
    req = TripPreferencesRequest(**payload)
    assert req.destination == "Goa"
    assert req.selected_stay is None


# ==========================================
# 4. Stay Normalization and Validation Helpers
# ==========================================
def test_stay_validation_helpers():
    s_valid = StayDomain(
        stay_id="GOA-STAY-001",
        stay_name="Panaji Residency",
        stay_type="Hotel",
        latitude=15.4989,
        longitude=73.8278
    )
    s_invalid_id = StayDomain(stay_id="", stay_name="Test", stay_type="Hotel")
    s_null_coords = StayDomain(stay_id="GOA-STAY-002", stay_name="Test2", stay_type="Villa")

    assert stay.validate_stay_id(s_valid) is True
    assert stay.validate_stay_id(s_invalid_id) is False
    assert stay.validate_stay_id(None) is False

    assert stay.validate_stay_coordinates(s_valid) is True
    assert stay.validate_stay_coordinates(s_null_coords) is False


# ==========================================
# 5. Haversine Distance Calculation
# ==========================================
def test_haversine_distance_calculation():
    # Panaji Residency to Benaulim (~30 km)
    dist = distance.haversine_distance_km(15.4989, 73.8278, 15.2447, 73.9168)
    assert 25.0 < dist < 35.0

    # Same location -> 0 km
    dist_zero = distance.haversine_distance_km(15.4989, 73.8278, 15.4989, 73.8278)
    assert dist_zero == 0.0

    # Missing coordinates -> inf
    assert distance.haversine_distance_km(None, 73.8278, 15.4989, 73.8278) == float('inf')


# ==========================================
# 6. Stay Proximity Scoring Boost
# ==========================================
def test_stay_proximity_scoring_boost():
    s = StayDomain(
        stay_id="GOA-STAY-001",
        stay_name="Taj Exotica",
        stay_type="Resort",
        latitude=15.2447,
        longitude=73.9168,
        rating=4.5
    )
    prefs = TripPreferencesRequest(
        destination="Goa",
        days=3,
        budget=20000,
        interests=["Beaches"],
        travel_pace=TravelPaceEnum.BALANCED,
        food_preference=FoodPreferenceEnum.ANY
    )

    near_candidate = CandidateItem(
        item_type="place",
        item_id="P_NEAR",
        name="Benaulim Beach",
        category="Beach",
        latitude=15.2450,
        longitude=73.9170,
        rating=4.5,
        cost=0
    )

    far_candidate = CandidateItem(
        item_type="place",
        item_id="P_FAR",
        name="Baga Beach",
        category="Beach",
        latitude=15.5553,
        longitude=73.7517,
        rating=4.5,
        cost=0
    )

    score_no_stay = recommendation.score_candidate(near_candidate, prefs)
    score_stay = recommendation.score_candidate(near_candidate, prefs, selected_stay=s)
    far_score_stay = recommendation.score_candidate(far_candidate, prefs, selected_stay=s)

    # Within 5km adds +15 pts
    assert score_stay == score_no_stay + 15.0
    assert score_stay > far_score_stay


# ==========================================
# 7. Stay-Aware Recommendation Ranking
# ==========================================
def test_stay_aware_recommendation_ranking():
    s = StayDomain(
        stay_id="GOA-STAY-001",
        stay_name="Panaji Residency",
        stay_type="Hotel",
        latitude=15.4989,
        longitude=73.8278
    )
    prefs = TripPreferencesRequest(
        destination="Goa",
        days=2,
        budget=15000,
        interests=["Beaches", "Culture"],
        travel_pace=TravelPaceEnum.BALANCED,
        food_preference=FoodPreferenceEnum.ANY
    )

    c_panaji = CandidateItem(
        item_type="place",
        item_id="P_PANAJI",
        name="Fontainhas",
        category="Culture",
        latitude=15.4980,
        longitude=73.8270,
        rating=4.5,
        cost=0
    )
    c_south = CandidateItem(
        item_type="place",
        item_id="P_SOUTH",
        name="Palolem Beach",
        category="Beach",
        latitude=15.0100,
        longitude=74.0200,
        rating=4.5,
        cost=0
    )

    ranked = recommendation.filter_and_rank_candidates([c_south, c_panaji], prefs, selected_stay=s)
    assert ranked[0].item_id == "P_PANAJI"


# ==========================================
# 8. Stay-Aware Scheduling Base Location
# ==========================================
def test_stay_aware_scheduling_base_location():
    s = StayDomain(
        stay_id="GOA-STAY-001",
        stay_name="Panaji Residency",
        stay_type="Hotel",
        area="Panaji",
        latitude=15.4989,
        longitude=73.8278
    )
    prefs = TripPreferencesRequest(
        destination="Goa",
        days=2,
        budget=15000,
        interests=["Beaches"],
        travel_pace=TravelPaceEnum.BALANCED,
        food_preference=FoodPreferenceEnum.ANY
    )

    c_near = CandidateItem(
        item_type="place",
        item_id="P_PANAJI",
        name="Fontainhas",
        category="Culture",
        latitude=15.4980,
        longitude=73.8270,
        rating=4.5,
        cost=0,
        details={"location_area": "Panaji"}
    )
    r_near = CandidateItem(
        item_type="restaurant",
        item_id="R_PANAJI",
        name="Ritz Classic",
        category="Goan",
        latitude=15.4985,
        longitude=73.8275,
        rating=4.5,
        cost=300,
        details={"area": "Panaji"}
    )
    a_near = CandidateItem(
        item_type="activity",
        item_id="A_PANAJI",
        name="Mandovi Cruise",
        category="Cruise",
        latitude=15.4990,
        longitude=73.8280,
        rating=4.5,
        cost=500,
        details={"area": "Panaji", "duration_hours": 1.5}
    )

    res = itinerary.build_deterministic_itinerary([c_near, r_near, a_near], prefs, selected_stay=s)
    assert res.total_days == 2
    assert "Panaji" in res.narrative_summary
    assert len(res.days[0].slots) > 0


# ==========================================
# 9. Budget & Cost Reconciliation Logic
# ==========================================
def test_costs_and_budget_reconciliation():
    assert costs.calculate_slot_cost("place", 100.0, 2) == 200.0
    assert costs.calculate_slot_cost("restaurant", 500.0, 1) == 500.0
    assert costs.calculate_slot_cost("place", -50.0, 1) == 0.0

    recon = costs.reconcile_budget(1200.0, 2000.0)
    assert recon["within_budget"] is True
    assert recon["remaining_budget_inr"] == 800.0

    recon_over = costs.reconcile_budget(2500.0, 2000.0)
    assert recon_over["within_budget"] is False
    assert recon_over["exceeded_by_inr"] == 500.0


# ==========================================
# 10. Gemini Grounded Prompt Formatting
# ==========================================
def test_gemini_grounded_prompt_formatting():
    s = StayDomain(
        stay_id="GOA-STAY-001",
        stay_name="Taj Exotica",
        stay_type="Resort",
        area="Benaulim",
        district="South Goa",
        latitude=15.2447,
        longitude=73.9168,
        rating=4.8,
        review_count=100
    )
    prefs = TripPreferencesRequest(
        destination="Goa",
        days=3,
        budget=20000,
        interests=["Beaches"],
        travel_pace=TravelPaceEnum.BALANCED,
        food_preference=FoodPreferenceEnum.ANY
    )
    cand = CandidateItem(
        item_type="place",
        item_id="P_BENAULIM",
        name="Benaulim Beach",
        category="Beach",
        latitude=15.2450,
        longitude=73.9170,
        rating=4.5,
        cost=0
    )

    prompt = llm.generate_grounded_itinerary_prompt([cand], prefs, selected_stay=s)
    assert "SELECTED VERIFIED ACCOMMODATION" in prompt
    assert "Taj Exotica" in prompt
    assert "GOA-STAY-001" in prompt
    assert "P_BENAULIM" in prompt
    assert "STRICT GROUNDING RULES" in prompt


# ==========================================
# 11. Data Adapter Normalization & Bounding
# ==========================================
def test_data_adapter_normalization_and_bounding():
    places = [
        PlaceDomain(
            place_id=f"P_{i}",
            name=f"Place {i}",
            category="Beach",
            latitude=15.5,
            longitude=73.8,
            entry_fee=10.0,
            rating=4.2
        )
        for i in range(15)
    ]
    restaurants = [
        RestaurantDomain(
            restaurant_id=f"R_{i}",
            restaurant_name=f"Rest {i}",
            cuisine="Goan",
            latitude=15.5,
            longitude=73.8,
            average_cost_for_two_inr=600.0,
            rating_value=4.5
        )
        for i in range(10)
    ]
    activities = [
        ActivityDomain(
            activity_id=f"A_{i}",
            activity_name=f"Act {i}",
            category="Water Sports",
            latitude=15.5,
            longitude=73.8,
            cost_inr=500.0
        )
        for i in range(10)
    ]

    normalized = data_adapter.normalize_candidates(places, restaurants, activities)
    assert len(normalized) == 35

    bounded = data_adapter.filter_top_bounded_candidates(normalized, max_total=20)
    assert len(bounded) == 20
