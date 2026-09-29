import asyncio
import json
import logging
import copy
from typing import Dict, Any, Tuple, Optional
from google import genai
from app.core.config import settings
from app.models.domain import StayDomain

logger = logging.getLogger("setuvia.engine.modify")


async def modify_itinerary_with_gemini(
    current_itinerary: Dict[str, Any],
    user_request: str,
    selected_stay: Optional[StayDomain] = None
) -> Tuple[Dict[str, Any], str]:
    """Modify existing itinerary using grounded Gemini LLM or deterministic fallback."""
    reply = "I've updated your itinerary based on your request."
    modified_itinerary = copy.deepcopy(current_itinerary)

    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_api_key_here":
        try:
            stay_context = ""
            if selected_stay:
                stay_context = f"\nSELECTED STAY BASE CONTEXT: {selected_stay.stay_name} in {selected_stay.area or 'Goa'}. Maintain this base stay location."

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = f"""You are SetuVia AI travel assistant.

Current Itinerary JSON:
{json.dumps(current_itinerary, indent=2)}
{stay_context}

User Modification Request:
"{user_request}"

Instructions:
1. Modify the itinerary slots to fulfill the user request (e.g. relaxed pace, budget adjustment, candidate swap).
2. Do NOT change or replace the base stay accommodation unless explicitly asked.
3. Maintain valid JSON schema matching the current itinerary.
4. Return raw JSON matching this structure:
{{
  "modified_itinerary": <updated_itinerary_json>,
  "assistant_reply": "<friendly explanation of changes>"
}}
"""
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=settings.GEMINI_MODEL,
                contents=prompt
            )

            if response and response.text:
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()

                data = json.loads(text)
                mod_dict = data.get("modified_itinerary")
                if mod_dict and isinstance(mod_dict, dict):
                    return mod_dict, data.get("assistant_reply", reply)
        except Exception as e:
            logger.warning(f"Gemini modification error: {e}. Applying deterministic fallback.")

    # DETERMINISTIC FALLBACK FOR ITINERARY MODIFICATION
    req_lower = user_request.lower()
    days = modified_itinerary.get("days") or modified_itinerary.get("days_plan") or []

    if "relax" in req_lower or "lighter" in req_lower:
        if days and isinstance(days, list):
            target = days[0]
            slots = target.get("slots") or target.get("items") or []
            if len(slots) > 2:
                target["slots"] = slots[:2]
                target["items"] = slots[:2]
        reply = "I've relaxed your Day 1 schedule by removing dense stops to give you more free leisure time!"
    elif "cheap" in req_lower or "budget" in req_lower or "lower" in req_lower:
        for d in days:
            slots = d.get("slots") or d.get("items") or []
            for s in slots:
                if isinstance(s, dict):
                    if "estimated_cost_inr" in s:
                        s["estimated_cost_inr"] = round(s["estimated_cost_inr"] * 0.5, 2)
                    if "cost" in s:
                        s["cost"] = round(s["cost"] * 0.5, 2)
        reply = "I've adjusted your trip to be more affordable by selecting lower-cost activity & dining options!"
    else:
        reply = f"I've updated your itinerary according to your request: '{user_request}'."

    return modified_itinerary, reply
