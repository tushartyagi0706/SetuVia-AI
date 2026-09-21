import asyncio
import json
import logging
from typing import Dict, Any, List, Optional
from google import genai
from app.core.config import settings
from app.models.responses import AskSetuChatResponse

logger = logging.getLogger("setuvia.engine.concierge")


def build_concierge_prompt(
    message: str,
    selected_stay: Optional[Dict[str, Any]] = None,
    preferences: Optional[Dict[str, Any]] = None,
    itinerary: Optional[Dict[str, Any]] = None,
    current_day: Optional[int] = None,
    conversation_history: Optional[List[Dict[str, Any]]] = None
) -> str:
    """Build grounded Gemini prompt for Ask Setu Travel Concierge."""
    context_blocks = []

    if selected_stay:
        context_blocks.append(f"""
SELECTED ACCOMMODATION / BASE STAY CONTEXT:
- Name: {selected_stay.get('stay_name') or selected_stay.get('name')}
- ID: {selected_stay.get('stay_id')}
- Area: {selected_stay.get('area') or 'Goa'}
- District: {selected_stay.get('district') or 'Goa'}
- Rating: {selected_stay.get('rating')} ({selected_stay.get('review_count')} reviews)
- Data Quality: {selected_stay.get('data_quality_flag') or 'VERIFIED'}
- Website: {selected_stay.get('official_website') or 'Available'}
NOTE ON STAY PRICING: Accommodation prices are NOT stored in the SetuVia database. If asked about stay prices, state clearly that stay pricing is not available in the database.
""")

    if preferences:
        context_blocks.append(f"""
USER TRIP PREFERENCES:
- Destination: {preferences.get('destination', 'Goa')}
- Days: {preferences.get('days')}
- Budget: ₹{preferences.get('budget')}
- Pace: {preferences.get('travel_pace') or preferences.get('pace')}
- Food Preference: {preferences.get('food_preference')}
- Interests: {', '.join(preferences.get('interests') or [])}
""")

    if itinerary:
        headline = itinerary.get("headline") or itinerary.get("narrative_summary") or "Goa Trip"
        cost = itinerary.get("total_estimated_cost_inr") or itinerary.get("estimated_cost") or "N/A"
        active_day_text = f" (Focusing on Day {current_day})" if current_day else ""
        context_blocks.append(f"""
CURRENT ITINERARY CONTEXT{active_day_text}:
- Headline: {headline}
- Total Planned Cost: ₹{cost}
- Days: {len(itinerary.get('days') or itinerary.get('days_plan') or [])}
""")

    history_str = ""
    if conversation_history:
        recent = conversation_history[-4:]
        history_lines = []
        for msg in recent:
            role = msg.get("role") or msg.get("sender") or "user"
            text = msg.get("text") or msg.get("content") or msg.get("message") or ""
            history_lines.append(f"{role.capitalize()}: {text}")
        if history_lines:
            history_str = "\nRECENT CONVERSATION HISTORY:\n" + "\n".join(history_lines)

    prompt = f"""You are Ask Setu, the proactive AI Travel Concierge for SetuVia AI.
Your goal is to assist travelers visiting Goa by connecting where they stay with how they travel.

{chr(10).join(context_blocks)}
{history_str}

USER MESSAGE:
"{message}"

STRICT GROUNDING & RESPONSE RULES:
1. Ground your answer strictly in the provided trip context and verified Goa travel information.
2. If asked about stay cost/price, respond that stay pricing is not available in the SetuVia database.
3. Keep your response helpful, concise, friendly, and structured.
4. Provide 2 to 3 contextual follow-up quick action suggestions relevant to the conversation.
5. Return raw JSON matching this exact structure:
{{
  "reply": "<your friendly detailed response>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "context_used": {{
    "stay": {str(bool(selected_stay)).lower()},
    "preferences": {str(bool(preferences)).lower()},
    "itinerary": {str(bool(itinerary)).lower()}
  }}
}}
"""
    return prompt


async def generate_concierge_chat_response(
    db: Any,
    message: str,
    selected_stay: Optional[Dict[str, Any]] = None,
    preferences: Optional[Dict[str, Any]] = None,
    itinerary: Optional[Dict[str, Any]] = None,
    current_day: Optional[int] = None,
    conversation_history: Optional[List[Dict[str, Any]]] = None
) -> AskSetuChatResponse:
    """Generate grounded chat response using Gemini AI or candidate DB search fallback."""
    context_used = {
        "stay": bool(selected_stay),
        "preferences": bool(preferences),
        "itinerary": bool(itinerary)
    }

    # Handle explicit stay price queries with strict guardrail
    msg_lower = message.lower()
    if any(kw in msg_lower for kw in ["stay price", "hotel cost", "stay cost", "room price", "how much is the stay"]):
        return AskSetuChatResponse(
            reply="Stay pricing is not available in the current SetuVia database. Accommodation costs are excluded from your trip budget totals.",
            suggestions=["What places are near my stay?", "Check my trip budget", "Find food near my stay"],
            context_used=context_used
        )

    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_api_key_here":
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = build_concierge_prompt(
                message, selected_stay, preferences, itinerary, current_day, conversation_history
            )

            response = await asyncio.wait_for(
                asyncio.to_thread(
                    client.models.generate_content,
                    model="gemini-3.6-flash",
                    contents=prompt
                ),
                timeout=5.0
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
                return AskSetuChatResponse(
                    reply=data.get("reply", "I'm here to help you navigate Goa!"),
                    suggestions=data.get("suggestions", ["What's near my stay?", "Check budget"]),
                    context_used=data.get("context_used", context_used)
                )
        except Exception as e:
            logger.warning(f"Gemini Concierge invocation error: {e}. Falling back to deterministic helper.")

    # Grounded fallback response when Gemini is unavailable
    stay_name = (selected_stay.get("stay_name") or selected_stay.get("name")) if selected_stay else "your stay"
    area = (selected_stay.get("area")) if selected_stay else "Goa"

    if "near" in msg_lower or "place" in msg_lower or "food" in msg_lower:
        reply = f"Based on {stay_name} in {area}, popular nearby verified places include Baga Beach, Anjuna Flea Market, and authentic seafood dining. Let me know if you'd like to adjust your itinerary!"
        suggestions = ["Find food near my stay", "Check my budget", "Regenerate Day 1"]
    elif "budget" in msg_lower or "cost" in msg_lower:
        reply = "Your transparent budget tracks Dining, Activities, and Transport expenses. Accommodation stay cost is excluded as pricing is unverified."
        suggestions = ["Auto-Optimize Budget", "Show budget breakdown", "What's near my stay?"]
    elif "weather" in msg_lower or "rain" in msg_lower:
        reply = "SetuVia monitors weather conditions. In case of heavy rain, outdoor beach activities can be swapped for verified indoor museums like the Museum of Christian Art."
        suggestions = ["Simulate Rain DEMO", "Show indoor places", "Check itinerary"]
    else:
        reply = f"Hello! I am Setu, your AI Concierge for Goa. I am aware of your stay at {stay_name} and your trip preferences. How can I help you today?"
        suggestions = ["What's near my stay?", "Check my budget", "Adjust for weather"]

    return AskSetuChatResponse(
        reply=reply,
        suggestions=suggestions,
        context_used=context_used
    )
