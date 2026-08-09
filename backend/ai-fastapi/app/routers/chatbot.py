from fastapi import APIRouter

from app.schemas.chatbot import ChatbotMessageRequest, ChatbotMessageResponse
from app.services.chatbot_service import process_message

router = APIRouter(tags=['chatbot'])


@router.post('/api/chatbot/message', response_model=ChatbotMessageResponse)
def handle_chatbot_message(payload: ChatbotMessageRequest):
    result = process_message(payload.message, payload.last_intent, payload.audience)
    return ChatbotMessageResponse(
        reply=str(result.get('reply', '')).strip(),
        intent=str(result.get('intent', 'fallback')).strip() or 'fallback',
        confidence=float(result.get('confidence', 0.0)),
        actions=list(result.get('actions') or []),
    )
