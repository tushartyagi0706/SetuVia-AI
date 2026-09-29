import pytest
from app.models.requests import (
    TripPreferencesRequest,
    TransparentBudgetRequest,
    OptimizeBudgetRequest,
    RegenerateDayRequest,
    AskSetuChatRequest,
    TravelPaceEnum,
    FoodPreferenceEnum,
)
from app.models.responses import (
    CandidateItem,
    TimeSlotItem,
    ItineraryDay,
    ItineraryResponse,
    WhyRecommended,
)
from app.models.domain import StayDomain, PlaceDomain
from app.engine.scoring import score_candidate_poi, generate_why_recommended_explanation
from app.engine.stay import get_stay_distance_to_candidate
from app.engine.costs import compute_transparent_budget, reconcile_budget
from app.engine.concierge import build_concierge_prompt, generate_concierge_chat_response


# ==========================================
# 1. Trust Evidence & Stay Domain Tests
# ==========================================

def test_stay_trust_evidence_fields():
    stay = StayDomain(
        stay_id="S001",
        stay_name="Ahilya By The Sea",
        stay_type="Heritage Resort",
        area="Nerul",
        district="North Goa",
        latitude=15.501,
        longitude=73.782,
        rating=4.8,
        review_count=120,
        official_website="https://ahilyabythesea.com",
        booking_url="https://booking.com/ahilya",
        data_source="Official Booking Portal",
        data_quality_flag="VERIFIED",
        last_checked_at="2026-03-15T10:00:00Z"
    )
    assert stay.stay_id == "S001"
    assert stay.data_quality_flag == "VERIFIED"
    assert stay.official_website == "https://ahilyabythesea.com"
    assert stay.booking_url == "https://booking.com/ahilya"


# ==========================================
# 2. Recommendation Explanation Tests
# ==========================================

def test_generate_why_recommended_explanation():
    stay = StayDomain(
        stay_id="S001",
        stay_name="Ahilya Resort",
        stay_type="Heritage Resort",
        latitude=15.500,
        longitude=73.800
    )
    cand = CandidateItem(
        item_type="place",
        item_id="P001",
        name="Fort Aguada",
        category="Heritage Fort",
        latitude=15.492,
        longitude=73.773,
        rating=4.6,
        cost=0.0
    )
    prefs = TripPreferencesRequest(
        destination="Goa",
        days=3,
        budget=15000,
        interests=["Heritage"],
        travel_pace=TravelPaceEnum.BALANCED,
        food_preference=FoodPreferenceEnum.ANY
    )
    exp = generate_why_recommended_explanation(cand, prefs, stay)
    assert exp["distance_from_stay_km"] is not None
    assert "Heritage" in exp["interest_match"]
    assert exp["budget_suitability"] == "Free entry / Zero cost"
    assert len(exp["reasons"]) >= 2


# ==========================================
# 3. Distance Calculation Tests
# ==========================================

def test_stay_distance_to_candidate():
    stay = StayDomain(
        stay_id="S001",
        stay_name="Test Stay",
        stay_type="Resort",
        latitude=15.498,
        longitude=73.827
    )
    cand = CandidateItem(
        item_type="place",
        item_id="P001",
        name="Miramar Beach",
        category="Beach",
        latitude=15.480,
        longitude=73.807,
        cost=0.0
    )
    dist = get_stay_distance_to_candidate(stay, cand)
    assert 1.0 <= dist <= 5.0


# ==========================================
# 4. Transparent Budget Calculation Tests
# ==========================================

def test_compute_transparent_budget_stay_price_null():
    itinerary = {
        "destination": "Goa",
        "budget": 20000,
        "days": [
            {
                "day": 1,
                "slots": [
                    {"item_type": "place", "name": "Beach", "estimated_cost_inr": 0},
                    {"item_type": "restaurant", "name": "Curry House", "estimated_cost_inr": 1200},
                    {"item_type": "activity", "name": "Boat Cruise", "estimated_cost_inr": 800}
                ]
            }
        ]
    }
    result = compute_transparent_budget(itinerary, 20000)
    assert result["total_budget"] == 20000.0
    assert result["breakdown"]["stay"] is None  # Stay pricing MUST remain null
    assert result["breakdown"]["food"] == 1200.0
    assert result["breakdown"]["activities"] == 800.0
    assert result["is_over_budget"] is False
    assert result["remaining_amount"] > 0


# ==========================================
# 5. Over-Budget Detection Tests
# ==========================================

def test_compute_transparent_budget_over_budget():
    itinerary = {
        "destination": "Goa",
        "budget": 2000,
        "days": [
            {
                "day": 1,
                "slots": [
                    {"item_type": "restaurant", "name": "Fine Dining", "estimated_cost_inr": 3500}
                ]
            }
        ]
    }
    result = compute_transparent_budget(itinerary, 2000)
    assert result["is_over_budget"] is True
    assert result["remaining_amount"] == 0.0


# ==========================================
# 6. Ask Setu Concierge Prompt & Guardrail Tests
# ==========================================

def test_concierge_stay_price_guardrail_prompt():
    prompt = build_concierge_prompt(
        message="How much is the stay price per night?",
        selected_stay={"stay_id": "S001", "stay_name": "Panjim Inn"}
    )
    assert "Accommodation prices are NOT stored in the SetuVia database" in prompt
    assert "Panjim Inn" in prompt


@pytest.mark.asyncio
async def test_concierge_chat_response_stay_price_direct():
    res = await generate_concierge_chat_response(
        db=None,
        message="What is the hotel room price?",
        selected_stay={"stay_id": "S001", "stay_name": "Ahilya"}
    )
    assert "Stay pricing is not available" in res.reply
    assert res.context_used["stay"] is True


# ==========================================
# 7. Request Model Validation Tests
# ==========================================

def test_transparent_budget_request_validation():
    req = TransparentBudgetRequest(
        current_itinerary={"days": []},
        total_budget=15000
    )
    assert req.total_budget == 15000.0


def test_regenerate_day_request_validation():
    req = RegenerateDayRequest(
        current_itinerary={"days": []},
        day_number=2,
        simulate_rain=True
    )
    assert req.day_number == 2
    assert req.simulate_rain is True


def test_ask_setu_chat_request_validation():
    req = AskSetuChatRequest(
        message="Find food options near my stay",
        selected_stay={"stay_id": "S001"}
    )
    assert req.message == "Find food options near my stay"
    assert req.selected_stay["stay_id"] == "S001"


@pytest.mark.asyncio
async def test_concierge_casual_small_talk():
    res = await generate_concierge_chat_response(
        db=None,
        message="hi bhai kya haal hai?",
        selected_stay={"stay_id": "S001", "stay_name": "Panaji Residency"}
    )
    assert "Setu" in res.reply or "bhai" in res.reply or "Goa" in res.reply
    assert len(res.suggestions) >= 2

