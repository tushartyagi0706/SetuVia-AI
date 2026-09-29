import asyncio
import json
import logging
import re
from typing import Dict, Any, List, Optional
from google import genai
from app.core.config import settings
from app.db import queries
from app.engine import data_adapter, stay, costs, scoring
from app.models.responses import AskSetuChatResponse, TransparentBudgetResponse
from app.models.domain import StayDomain
from app.models.requests import TripPreferencesRequest

logger = logging.getLogger("setuvia.engine.concierge")


def classify_user_intent(message: str) -> str:
    """Classify user intent into one of 9 distinct categories based on message content."""
    msg = message.lower().strip()

    # 1. Day regeneration (explicit request to regenerate/redo a day)
    if any(kw in msg for kw in ["regenerate day", "redo day", "re-generate day"]):
        return "day_regeneration"

    # 2. Itinerary modification (explicit requests to tweak/modify schedule)
    modify_keywords = [
        "make day", "more relaxed", "lighter schedule", "cheaper", "reduce budget",
        "lower budget", "remove beach", "add activity", "add one more", "replace",
        "change itinerary", "modify itinerary", "update itinerary", "rearrange",
        "start day at", "less travel", "make my trip", "hata do", "hatao", "badal do",
        "change restaurant", "change place", "modify schedule", "make it cheaper"
    ]
    if any(kw in msg for kw in modify_keywords):
        return "itinerary_modify"

    # 3. Weather query
    if any(kw in msg for kw in ["weather", "rain", "barish", "raining", "storm"]):
        return "weather_query"

    # 4. Recommendation explanation
    if any(kw in msg for kw in ["why these", "why recommendation", "why this place", "why suggested", "kyun suggest", "kyu suggest"]):
        return "recommendation_explanation"

    # 5. Budget query (asking about current budget/spending without asking to modify)
    if any(kw in msg for kw in ["budget", "cost", "kharcha", "expense", "remaining budget", "over budget", "spending", "kitna bacha"]):
        return "budget_query"

    # 6. Nearby query (asking what's near stay without asking to modify itinerary)
    if any(kw in msg for kw in ["near my stay", "near stay", "aas paas", "paas kya", "around stay", "attractions near", "spots near"]):
        return "nearby_query"

    # 7. Dining query (asking for restaurant tips without asking to modify itinerary)
    if any(kw in msg for kw in ["dining", "restaurant", "food", "khane", "eat", "seafood", "lunch", "dinner"]):
        return "dining_query"

    # 8. Casual chat (greetings, jokes, small talk)
    casual_keywords = [
        "hi", "hello", "hey", "namaste", "hola", "hi bhai", "hello bhai", "kya haal",
        "kaise ho", "bore", "boring", "joke", "what's up", "watsup", "thank you",
        "thanks", "haha", "lol", "good morning", "good evening"
    ]
    words = msg.split()
    if len(words) <= 4 or any(kw in msg for kw in casual_keywords):
        if not any(t_kw in msg for t_kw in ["itinerary", "recommendation", "hotel", "residency", "schedule"]):
            return "casual_chat"

    # 9. Fallback general travel query
    return "general_travel_query"


def build_concierge_prompt(
    message: str,
    intent: str = "general_travel_query",
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

    prompt = f"""You are Setu, a friendly, witty, and proactive AI Travel Concierge for SetuVia AI in Goa.

DETECTED INTENT: {intent}

{chr(10).join(context_blocks)}
{history_str}

USER MESSAGE:
"{message}"

BEHAVIOR & RESPONSE RULES:
1. INTENT COMPLIANCE:
   - If intent is "casual_chat": Be warm, witty, and conversational (e.g. "Hey bhai! 😄 Kya haal hai?"). Do NOT talk about itinerary updates unless asked.
   - If intent is "budget_query": Answer about trip expenses and remaining budget cleanly. Do NOT say itinerary was updated.
   - If intent is "nearby_query" or "dining_query": Answer with nearby places/restaurants based on stay context.
   - If intent is "recommendation_explanation": Explain distance from stay, budget, and pace suitability.
   - If intent is "itinerary_modify" or "day_regeneration": Explain how you've updated the trip plan.

2. STAY PRICING GUARDRAIL: If asked about stay cost/price, explain clearly that stay pricing is not available in the SetuVia database.

3. SUGGESTIONS: Provide 2 to 3 contextual follow-up quick action suggestions.

4. Return raw JSON matching this structure:
{{
  "intent": "{intent}",
  "reply": "<your friendly natural response>",
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
    """Generate grounded chat response with explicit intent classification and safe routing."""
    from app.services import itinerary_service

    context_used = {
        "stay": bool(selected_stay),
        "preferences": bool(preferences),
        "itinerary": bool(itinerary)
    }

    msg_lower = message.lower().strip()

    # Classify intent
    intent = classify_user_intent(message)
    logger.info(f"Classified Ask Setu message intent: '{intent}' for query: '{message}'")

    # Guardrail 1: Stay price queries
    if any(kw in msg_lower for kw in ["stay price", "hotel cost", "stay cost", "room price", "how much is the stay"]):
        return AskSetuChatResponse(
            reply="Stay pricing is not available in the current SetuVia database. Accommodation costs are excluded from your trip budget totals.",
            intent="general_travel_query",
            itinerary_modified=False,
            modified_itinerary=None,
            suggestions=["What places are near my stay?", "Check my trip budget", "Find food near my stay"],
            context_used=context_used
        )

    # ROUTING PATH 1: Explicit Itinerary Modification Intent
    if intent == "itinerary_modify" and itinerary:
        logger.info("Routing to itinerary modification service...")
        try:
            modified_dict, reply_text = await itinerary_service.modify_existing_itinerary(itinerary, message)
            return AskSetuChatResponse(
                reply=reply_text or "I've updated your itinerary based on your request.",
                intent="itinerary_modify",
                itinerary_modified=True,
                modified_itinerary=modified_dict,
                suggestions=["Check modified budget", "Show stay map", "Ask Setu something else"],
                context_used=context_used
            )
        except Exception as e:
            logger.error(f"Error modifying itinerary in chat: {e}")
            return AskSetuChatResponse(
                reply=f"Sorry, I couldn't modify the itinerary right now: {str(e)}",
                intent="itinerary_modify",
                itinerary_modified=False,
                modified_itinerary=None,
                suggestions=["Check budget", "What's near my stay?"],
                context_used=context_used
            )

    # ROUTING PATH 2: Explicit Day Regeneration Intent
    if intent == "day_regeneration" and itinerary:
        logger.info("Routing to day regeneration service...")
        try:
            day_match = re.search(r"day\s*(\d+)", msg_lower)
            target_day = int(day_match.group(1)) if day_match else (current_day or 1)

            base_stay_domain = stay.normalize_stay(selected_stay) if selected_stay else None
            pref_req = TripPreferencesRequest(**preferences) if preferences else None

            modified_dict = await itinerary_service.regenerate_single_day(
                db=db,
                current_itinerary=itinerary,
                day_number=target_day,
                selected_stay=base_stay_domain,
                prefs=pref_req,
                simulate_rain=False
            )
            return AskSetuChatResponse(
                reply=f"I've regenerated Day {target_day} for you while keeping all other days unchanged!",
                intent="day_regeneration",
                itinerary_modified=True,
                modified_itinerary=modified_dict,
                suggestions=["View regenerated day", "Check budget", "Regenerate another day"],
                context_used=context_used
            )
        except Exception as e:
            logger.error(f"Error regenerating day in chat: {e}")
            return AskSetuChatResponse(
                reply=f"Sorry, I couldn't regenerate that day: {str(e)}",
                intent="day_regeneration",
                itinerary_modified=False,
                modified_itinerary=None,
                suggestions=["Try again", "What's near my stay?"],
                context_used=context_used
            )

    # ROUTING PATH 3: Non-modifying intents (Gemini AI or Grounded Fallback handlers)
    stay_name = (selected_stay.get("stay_name") or selected_stay.get("name")) if selected_stay else "your stay"
    area = (selected_stay.get("area")) if selected_stay else "Goa"

    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_api_key_here":
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = build_concierge_prompt(
                message, intent, selected_stay, preferences, itinerary, current_day, conversation_history
            )

            response = await asyncio.wait_for(
                asyncio.to_thread(
                    client.models.generate_content,
                    model=settings.GEMINI_MODEL,
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
                    intent=intent,
                    itinerary_modified=False,
                    modified_itinerary=None,
                    suggestions=data.get("suggestions", ["What's near my stay?", "Check budget"]),
                    context_used=data.get("context_used", context_used)
                )
        except Exception as e:
            logger.warning(f"Gemini Concierge invocation error: {e}. Using grounded deterministic response.")

    # GROUNDED DETERMINISTIC INTENT HANDLERS (Fallback when Gemini is offline or slow)

    # Intent: Casual Chat
    if intent == "casual_chat":
        if any(kw in msg_lower for kw in ["bore", "boring"]):
            reply = f"Arre bore mat ho bhai! 😄 Goa trip in progress hai. Aapka stay **{stay_name}** ({area}) ready hai. Batao stay ke paas beach dekhne chalein ya live food spots?"
            suggestions = ["What's near my stay?", "Local dining tips", "Check my budget"]
        elif any(kw in msg_lower for kw in ["kya haal", "kaise ho", "what's up", "watsup"]):
            reply = "Ekdum mast bhai! 😎 Goa ki breeze aur vibes zabardast hain. Batao aaj trip ke baare mein kya janna hai?"
            suggestions = ["What's near my stay?", "Local dining tips", "Check trip budget"]
        else:
            reply = f"Hey bhai! 😄 Kya haal hai? Main Setu hu, aapka AI travel companion for Goa. Aapka stay **{stay_name}** ({area}) ready hai! Batao kaise help karu?"
            suggestions = ["What's near my stay?", "Check my budget", "Local dining tips"]

    # Intent: Budget Query
    elif intent == "budget_query":
        total_b = float(preferences.get("budget", 25000)) if preferences else 25000.0
        if itinerary:
            b_res = costs.compute_transparent_budget(itinerary, total_b)
            planned = b_res["planned_amount"]
            rem = b_res["remaining_amount"]
            bd = b_res["breakdown"]
            reply = f"Abhi tumhara planned budget ₹{planned:,.0f} ke around hai aur total budget ₹{total_b:,.0f} hai, so roughly ₹{rem:,.0f} remaining hai.\n\n📊 Breakdown:\n- 🍽️ Dining: ₹{bd['food']:,.0f}\n- 🎟️ Activities: ₹{bd['activities']:,.0f}\n- 🚕 Transport: ₹{bd['transport']:,.0f}\n(Note: Accommodation stay cost is excluded as pricing is unverified)."
            suggestions = ["Make my trip cheaper", "What's near my stay?", "Local dining tips"]
        else:
            reply = f"Aapka total target budget ₹{total_b:,.0f} set hai. Transparent budget me Dining, Activities aur Transport include hote hain (Stay cost is excluded)."
            suggestions = ["Generate itinerary", "What's near my stay?"]

    # Intent: Nearby Query
    elif intent == "nearby_query":
        try:
            db_places = await queries.get_all_places(db)
            base_stay_domain = stay.normalize_stay(selected_stay) if selected_stay else None

            norm_places = data_adapter.normalize_candidates(db_places, [], [])
            if base_stay_domain and base_stay_domain.latitude and base_stay_domain.longitude:
                norm_places.sort(key=lambda c: stay.get_stay_distance_to_candidate(base_stay_domain, c))

            top3 = norm_places[:3]
            places_list = []
            for p in top3:
                d_km = stay.get_stay_distance_to_candidate(base_stay_domain, p) if base_stay_domain else 2.5
                places_list.append(f"• **{p.name}** ({d_km:.1f} km from stay) - {p.category}")

            places_text = "\n".join(places_list) if places_list else f"• Baga Beach\n• Anjuna Flea Market\n• Fort Aguada"
            reply = f"Aapki stay **{stay_name}** ({area}) ke paas ye top verified places hain:\n{places_text}\n\nSabhi spots stay se short distance par hain!"
            suggestions = ["Local dining tips", "Why these recommendations?", "Check my budget"]
        except Exception as e:
            logger.warning(f"Error fetching nearby places from DB: {e}")
            reply = f"Aapki stay **{stay_name}** in {area} ke paas popular verified places me Baga Beach, Anjuna Flea Market, aur Fort Aguada shamil hain."
            suggestions = ["Local dining tips", "Check my budget"]

    # Intent: Dining Query
    elif intent == "dining_query":
        try:
            db_rests = await queries.get_all_restaurants(db)
            base_stay_domain = stay.normalize_stay(selected_stay) if selected_stay else None

            norm_rests = data_adapter.normalize_candidates([], db_rests, [])
            if base_stay_domain and base_stay_domain.latitude and base_stay_domain.longitude:
                norm_rests.sort(key=lambda c: stay.get_stay_distance_to_candidate(base_stay_domain, c))

            top3 = norm_rests[:3]
            rests_list = []
            for r in top3:
                d_km = stay.get_stay_distance_to_candidate(base_stay_domain, r) if base_stay_domain else 3.0
                area_name = r.details.get("location_area") or r.details.get("area") or "Goa"
                rests_list.append(f"• **{r.name}** ({area_name}, {d_km:.1f} km) - ₹{r.cost:.0f} approx")

            rests_text = "\n".join(rests_list) if rests_list else "• Anand Bar & Restaurant\n• Fisherman's Wharf\n• Ritz Classic"
            reply = f"Aapki stay **{stay_name}** ke paas authentic local dining options:\n{rests_text}\n\nYe sabhi verified spots authentic Goan seafood aur local cuisine serve karte hain!"
            suggestions = ["What's near my stay?", "Check my budget", "Why these recommendations?"]
        except Exception as e:
            logger.warning(f"Error fetching dining from DB: {e}")
            reply = f"Aapki stay **{stay_name}** in {area} ke paas popular verified dining spots me Anand Bar and Restaurant aur Fisherman's Wharf shamil hain."
            suggestions = ["What's near my stay?", "Check my budget"]

    # Intent: Recommendation Explanation
    elif intent == "recommendation_explanation":
        budget_str = f"₹{preferences.get('budget', 25000):,.0f}" if preferences else "₹25,000"
        pace_str = preferences.get("travel_pace") or preferences.get("pace") if preferences else "Balanced"
        reply = f"Aapki trip recommendations **{stay_name}** ke anchor par calculate ki gayi hain:\n\n1. 📍 **Proximity (Distances)**: Sabhi morning & evening stops stay se short distance (0.3 - 5 km) par rakhe gaye hain to minimize travel time.\n2. 🎯 **Interest Match**: Activities aapke selected interests ke saath align karti hain.\n3. 💰 **Budget Suitability**: Total estimated cost target budget ({budget_str}) ke andar hai.\n4. ⏱️ **Pace Fit**: Schedule aapke {pace_str} pace choice ke according structured hai."
        suggestions = ["What's near my stay?", "Check my budget", "Local dining tips"]

    # Intent: Weather Query
    elif intent == "weather_query":
        reply = "SetuVia monitors live weather conditions. Heavy rain hone par outdoor beach activities automatically verified indoor places (Jaise Museum of Christian Art) aur indoor dining se replace ho sakti hain."
        suggestions = ["Simulate Rain DEMO", "Show indoor places", "Check itinerary"]

    # Intent: General Travel Query Fallback
    else:
        reply = f"Hello! Main Setu hu, aapka AI Travel Concierge. Main aapke stay **{stay_name}** at {area} aur preferences se fully aware hu. Batao aaj trip ke baare mein kya janna hai?"
        suggestions = ["What's near my stay?", "Check my budget", "Local dining tips"]

    return AskSetuChatResponse(
        reply=reply,
        intent=intent,
        itinerary_modified=False,
        modified_itinerary=None,
        suggestions=suggestions,
        context_used=context_used
    )
