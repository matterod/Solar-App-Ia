"""
Agent router — Web API endpoint for Sol AI.

Delegates the actual agent loop to services/agent/chat_service.py,
which is shared with the Telegram webhook handler.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import get_settings
from app.database import get_db
from app.services.agent.chat_service import run_agent_chat
from app.services.plan_limits import check_limit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["AI Agent"])


# ── Request / Response schemas ────────────────────────────────────────────────

class AgentMessage(BaseModel):
    message: str
    history: list[dict] = []
    context: Optional[dict] = None


class AgentResponse(BaseModel):
    response: str
    tool_calls: list = []
    metadata: Optional[dict] = None


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=AgentResponse)
async def chat_with_agent(
    message: AgentMessage,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _limit=Depends(check_limit("ai_questions")),
):
    """Send a message to Sol and get an AI-powered response."""
    settings = get_settings()

    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="Anthropic API key no configurada. Agregá ANTHROPIC_API_KEY al archivo .env",
        )

    response_text, tool_calls_log = await run_agent_chat(
        message=message.message,
        history=message.history,
        current_user=current_user,
        db=db,
    )

    return AgentResponse(
        response=response_text,
        tool_calls=tool_calls_log,
        metadata={
            "model": "claude-haiku-4-5",
            "user": current_user["email"],
        },
    )
