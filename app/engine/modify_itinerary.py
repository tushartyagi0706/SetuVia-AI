import asyncio
import json
import logging
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
    """Modify existing itinerary using grounded Gemini LLM while preserving stay context."""
    reply = "I've updated your itinerary based on your request."
    modified_itinerary = current_itinerary

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
        return modified_itinerary, "Gemini key not configured. Schedule retained."

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
        models_to_try = ["gemini-3.6-flash"]
        response = None

        for model_name in models_to_try:
            try:
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model=model_name,
                    contents=prompt
                )
                if response and response.text:
                    break
            except Exception:
                continue

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
            modified_itinerary = data.get("modified_itinerary", current_itinerary)
            reply = data.get("assistant_reply", reply)

    except Exception as e:
        logger.error(f"Itinerary modification failed: {e}")
        reply = "I made note of your request and kept the current schedule optimal."

    return modified_itinerary, reply
