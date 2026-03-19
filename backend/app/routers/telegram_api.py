"""
Telegram API router — REST endpoints consumed by the web frontend.

  POST /telegram/link-code   Generate a one-time code to link a Telegram account
  GET  /telegram/status      Check if the current user has a linked Telegram
  DELETE /telegram/link      Unlink the current user's Telegram account
  POST /telegram/setup-webhook  Register the webhook URL with Telegram (admin)
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import get_settings
from app.database import get_db
from app.services import telegram_service as tg

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telegram", tags=["Telegram"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class LinkCodeResponse(BaseModel):
    code: str
    expires_minutes: int = 10
    bot_username: str = ""


class TelegramStatusResponse(BaseModel):
    linked: bool
    telegram_username: str | None = None
    linked_at: str | None = None


class WebhookSetupRequest(BaseModel):
    webhook_url: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/link-code", response_model=LinkCodeResponse)
async def generate_link_code(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a fresh one-time code (10-min TTL) for the current user.
    The user sends /vincular <code> to the Telegram bot to complete linking.
    """
    settings = get_settings()

    code = await tg.generate_link_code(
        db,
        user_id=current_user["id"],
        company_id=current_user["company_id"],
    )

    # Try to get the bot username to show in the UI
    bot_username = ""
    if settings.telegram_bot_token:
        try:
            info = await tg.get_bot_info(settings.telegram_bot_token)
            bot_username = info.get("result", {}).get("username", "")
        except Exception:
            pass

    return LinkCodeResponse(code=code, bot_username=bot_username)


@router.get("/status", response_model=TelegramStatusResponse)
async def telegram_status(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return whether the current user has a linked Telegram account."""
    link = await tg.get_link_for_user(db, current_user["id"])
    if not link:
        return TelegramStatusResponse(linked=False)

    return TelegramStatusResponse(
        linked=True,
        telegram_username=link.telegram_username,
        linked_at=link.linked_at.isoformat() if link.linked_at else None,
    )


@router.delete("/link", status_code=204)
async def unlink_telegram(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove the Telegram link for the current user."""
    await tg.unlink_by_user_id(db, current_user["id"])
    return None


@router.post("/setup-webhook")
async def setup_webhook(
    body: WebhookSetupRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Register the webhook URL with Telegram.
    Restricted to superadmins.
    Call once after deploying to a public URL.
    """
    if not current_user.get("is_superadmin"):
        raise HTTPException(status_code=403, detail="Solo superadmins pueden configurar el webhook")

    settings = get_settings()
    if not settings.telegram_bot_token:
        raise HTTPException(status_code=503, detail="TELEGRAM_BOT_TOKEN no configurado")

    result = await tg.set_webhook(
        settings.telegram_bot_token,
        body.webhook_url,
        settings.telegram_webhook_secret,
    )
    return result
