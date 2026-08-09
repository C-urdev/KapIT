from typing import Literal

from pydantic import BaseModel, Field, field_validator


class ChatbotMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=320)
    last_intent: str | None = Field(default=None, min_length=1, max_length=40)
    audience: Literal['general', 'employer'] = 'general'

    @field_validator('message')
    @classmethod
    def strip_message(cls, value: str) -> str:
        normalized = str(value or '').strip()
        if not normalized:
            raise ValueError('message must not be empty')
        return normalized

    @field_validator('last_intent')
    @classmethod
    def strip_last_intent(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = str(value or '').strip().lower()
        return normalized or None


class ChatbotAction(BaseModel):
    type: str = Field(default='navigate')
    label: str = Field(..., min_length=1, max_length=80)
    href: str = Field(..., min_length=1, max_length=255)

    @field_validator('type')
    @classmethod
    def normalize_type(cls, value: str) -> str:
        normalized = str(value or '').strip().lower()
        return normalized or 'navigate'

    @field_validator('href')
    @classmethod
    def ensure_relative_href(cls, value: str) -> str:
        normalized = str(value or '').strip()
        if not normalized.startswith('/'):
            raise ValueError('href must be a relative path starting with "/"')
        return normalized


class ChatbotMessageResponse(BaseModel):
    reply: str
    intent: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    actions: list[ChatbotAction] = Field(default_factory=list)
