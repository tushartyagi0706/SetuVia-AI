import logging
from typing import Dict, Any, List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.engine import concierge
from app.models.responses import AskSetuChatResponse

logger = logging.getLogger("setuvia.services.chat")


async def process_concierge_chat(
    db: AsyncIOMotorDatabase,
    message: str,
    selected_stay: Optional[Dict[str, Any]] = None,
    preferences: Optional[Dict[str, Any]] = None,
    itinerary: Optional[Dict[str, Any]] = None,
    current_day: Optional[int] = None,
    conversation_history: Optional[List[Dict[str, Any]]] = None
) -> AskSetuChatResponse:
    """Orchestrate Ask Setu AI Travel Concierge chat process."""
    logger.info(f"Processing Ask Setu chat request: '{message[:40]}...'")
    return await concierge.generate_concierge_chat_response(
        db=db,
        message=message,
        selected_stay=selected_stay,
        preferences=preferences,
        itinerary=itinerary,
        current_day=current_day,
        conversation_history=conversation_history
    )
