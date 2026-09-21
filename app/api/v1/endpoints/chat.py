from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from app.services import chat_service
from app.models.requests import AskSetuChatRequest
from app.models.responses import AskSetuChatResponse

router = APIRouter()


@router.post("/chat", response_model=AskSetuChatResponse, tags=["Concierge"])
async def ask_setu_chat(
    req: AskSetuChatRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Ask Setu — AI Travel Concierge chat endpoint.
    Receives user message with full stay/itinerary/preference context,
    grounds responses in verified SetuVia data via Gemini AI or candidate DB search fallback.
    """
    try:
        return await chat_service.process_concierge_chat(
            db=db,
            message=req.message,
            selected_stay=req.selected_stay,
            preferences=req.preferences,
            itinerary=req.itinerary,
            current_day=req.current_day,
            conversation_history=req.conversation_history
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ask Setu chat failed: {str(e)}"
        )
