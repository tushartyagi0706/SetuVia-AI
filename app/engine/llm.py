import asyncio
import json
import logging
from typing import List, Dict, Any, Optional
from google import genai
from app.core.config import settings
from app.models.requests import TripPreferencesRequest
from app.models.responses import CandidateItem, ItineraryResponse
from app.models.domain import StayDomain
from app.engine.data_adapter import filter_top_bounded_candidates

logger = logging.getLogger("setuvia.engine.llm")


def generate_grounded_itinerary_prompt(
    candidates: List[CandidateItem],
    prefs: TripPreferencesRequest,
    selected_stay: Optional[StayDomain] = None
) -> str:
    """Build grounded prompt exposing ONLY verified candidates and full stay context."""
    bounded_candidates = filter_top_bounded_candidates(candidates, max_total=20)
    candidates_summary = []
    for c in bounded_candidates:
        candidates_summary.append({
            "item_type": c.item_type,
            "item_id": c.item_id,
            "name": c.name,
            "category": c.category,
            "cost_inr": c.cost,
            "rating": c.rating,
            "area": c.details.get("location_area") or c.details.get("area") or "Goa",
            "latitude": c.latitude,
            "longitude": c.longitude
        })

    stay_text = ""
    if selected_stay:
        stay_text = f"""
SELECTED VERIFIED ACCOMMODATION / BASE LOCATION:
- Stay ID: {selected_stay.stay_id}
- Property Name: {selected_stay.stay_name}
- Type: {selected_stay.stay_type}
- Area: {selected_stay.area or 'Goa'}
- District: {selected_stay.district or 'Goa'}
- Coordinates: Latitude {selected_stay.latitude}, Longitude {selected_stay.longitude}
- Rating: {selected_stay.rating} ({selected_stay.review_count} reviews)
- Official Website: {selected_stay.official_website or 'N/A'}

INSTRUCTION: Use the selected stay's location in {selected_stay.area or 'Goa'} as the base anchor for structuring daily itineraries and favoring nearby candidates.
"""

    prompt = f"""You are SetuVia AI, an expert travel concierge for Goa.

User Trip Preferences:
- Destination: {prefs.destination}
- Duration: {prefs.days} Days
- Budget: ₹{prefs.budget}
- Pace: {prefs.travel_pace.value}
- Food Preference: {prefs.food_preference.value}
- Interests: {', '.join(prefs.interests)}
{stay_text}

STRICT GROUNDING RULES:
1. You MUST select items ONLY from the supplied Candidate List below.
2. Do NOT invent or hallucinate any place, restaurant, activity, price, rating, or coordinate.
3. Keep the total estimated cost within the user's budget of ₹{prefs.budget}.
4. Return raw JSON matching this exact structure:
{{
  "destination": "{prefs.destination}",
  "total_days": {prefs.days},
  "total_estimated_cost_inr": <number>,
  "narrative_summary": "<narrative summary>",
  "days": [
    {{
      "day": 1,
      "title": "<day title>",
      "area_cluster": "<area>",
      "slots": [
        {{
          "slot": "Morning",
          "item_type": "place",
          "item_id": "<item_id>",
          "name": "<name>",
          "category": "<category>",
          "estimated_duration_hours": 2.0,
          "estimated_cost_inr": <cost>,
          "location_area": "<area>",
          "latitude": <lat>,
          "longitude": <lon>,
          "notes_or_tips": "<tips>"
        }}
      ]
    }}
  ]
}}

VERIFIED CANDIDATE LIST:
{json.dumps(candidates_summary, indent=2)}
"""
    return prompt


async def generate_grounded_itinerary_with_gemini(
    candidates: List[CandidateItem],
    prefs: TripPreferencesRequest,
    selected_stay: Optional[StayDomain] = None
) -> Optional[ItineraryResponse]:
    """Invoke Gemini model asynchronously offloading blocking I/O to a worker thread."""
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
        logger.warning("GEMINI_API_KEY not configured or placeholder. Falling back to deterministic engine.")
        return None

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        prompt = generate_grounded_itinerary_prompt(candidates, prefs, selected_stay=selected_stay)

        models_to_try = [settings.GEMINI_MODEL]
        response = None

        for model_name in models_to_try:
            try:
                # Offload blocking synchronous GenAI SDK call to a worker thread with 7-second timeout
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        client.models.generate_content,
                        model=model_name,
                        contents=prompt
                    ),
                    timeout=7.0
                )
                if response and response.text:
                    logger.info(f"Gemini generation succeeded using model '{model_name}'")
                    break
            except Exception as model_err:
                logger.warning(f"Model '{model_name}' generation error or timeout: {model_err}")
                continue

        if not response or not response.text:
            logger.warning("Empty response from all Gemini models. Falling back to deterministic engine.")
            return None

        # Clean JSON markdown fences if present
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        data = json.loads(text)
        candidate_map = {c.item_id: c for c in candidates}
        if isinstance(data, dict) and "days" in data:
            from app.engine.itinerary import enrich_slot_with_explanation
            for day in data.get("days", []):
                for slot in day.get("slots", []):
                    item_id = slot.get("item_id")
                    if item_id and item_id in candidate_map:
                        cand = candidate_map[item_id]
                        if not slot.get("image_url"):
                            slot["image_url"] = cand.details.get("image_url") or cand.details.get("image")
                        if not slot.get("image_source"):
                            slot["image_source"] = cand.details.get("image_source")

                        exp_data = enrich_slot_with_explanation(cand, prefs, selected_stay)
                        slot["distance_from_stay_km"] = exp_data["distance_from_stay_km"]
                        slot["recommendation_reason"] = exp_data["recommendation_reason"]
                        slot["reasons"] = exp_data["reasons"]
                        slot["why_recommended"] = exp_data["why_recommended"]

        return ItineraryResponse(**data)

    except Exception as e:
        logger.error(f"Gemini LLM generation failed: {e}. Falling back to deterministic engine.")
        return None

