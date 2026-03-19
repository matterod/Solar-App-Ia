"""
Telegram service — Bot API client, account linking, and conversation history.
Uses httpx (already in requirements) for outbound calls to Telegram Bot API.
"""

import logging
import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.telegram import TelegramLink, TelegramLinkCode, TelegramMessage
from app.models.user import User
from app.models.company import Company

logger = logging.getLogger(__name__)

TELEGRAM_API = "https://api.telegram.org/bot{token}"
MAX_HISTORY = 20          # messages to load per chat
MAX_MSG_LEN = 4000        # Telegram's limit is 4096; we leave room for safety


# ── Bot API helpers ──────────────────────────────────────────────────────────

async def _api(token: str, method: str, payload: dict) -> dict:
    """Call Telegram Bot API asynchronously."""
    url = f"{TELEGRAM_API.format(token=token)}/{method}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(url, json=payload)
            return r.json()
    except Exception as e:
        logger.error(f"Telegram API error [{method}]: {e}")
        return {"ok": False, "error": str(e)}


async def send_message(token: str, chat_id: int, text: str) -> None:
    """Send a text message, splitting if over Telegram's character limit."""
    # Strip common markdown that WeasyPrint / Anthropic use but Telegram can choke on
    chunks = [text[i : i + MAX_MSG_LEN] for i in range(0, len(text), MAX_MSG_LEN)]
    for chunk in chunks:
        await _api(token, "sendMessage", {
            "chat_id": chat_id,
            "text": chunk,
            "parse_mode": "Markdown",
        })


async def send_typing(token: str, chat_id: int) -> None:
    """Send 'typing…' indicator."""
    await _api(token, "sendChatAction", {
        "chat_id": chat_id,
        "action": "typing",
    })


async def send_document(
    token: str,
    chat_id: int,
    file_bytes: bytes,
    filename: str,
    caption: str = "",
) -> None:
    """Send a file (e.g. PDF) as a Telegram document using multipart upload."""
    url = f"{TELEGRAM_API.format(token=token)}/sendDocument"
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            files = {"document": (filename, file_bytes, "application/pdf")}
            data: dict = {"chat_id": str(chat_id)}
            if caption:
                data["caption"] = caption
            await client.post(url, data=data, files=files)
    except Exception as e:
        logger.error(f"Telegram send_document error: {e}")


async def set_webhook(token: str, webhook_url: str, secret: str) -> dict:
    """Register the webhook URL with Telegram."""
    result = await _api(token, "setWebhook", {
        "url": webhook_url,
        "secret_token": secret,
        "allowed_updates": ["message"],
    })
    logger.info(f"Telegram setWebhook → {result}")
    return result


async def delete_webhook(token: str) -> dict:
    """Remove the current webhook (useful for local dev / polling mode)."""
    result = await _api(token, "deleteWebhook", {})
    logger.info(f"Telegram deleteWebhook → {result}")
    return result


async def get_bot_info(token: str) -> dict:
    """Return basic info about the bot (username, id)."""
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{TELEGRAM_API.format(token=token)}/getMe")
        return r.json()


# ── Link codes ───────────────────────────────────────────────────────────────

def _random_code(length: int = 6) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


async def generate_link_code(
    db: AsyncSession,
    user_id,
    company_id,
) -> str:
    """Create a fresh one-time link code (10-minute TTL). Returns the code string."""
    # Invalidate any previous unused code for this user
    await db.execute(
        delete(TelegramLinkCode).where(
            TelegramLinkCode.user_id == user_id,
            TelegramLinkCode.used == False,
        )
    )

    code = _random_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    link_code = TelegramLinkCode(
        user_id=user_id,
        company_id=company_id,
        code=code,
        expires_at=expires_at,
    )
    db.add(link_code)
    await db.commit()
    return code


async def verify_link_code(
    db: AsyncSession,
    code: str,
    chat_id: int,
    username: Optional[str],
) -> Optional[dict]:
    """
    Validate a link code and create the TelegramLink.
    Returns the user dict (same shape as auth.get_current_user) or None on failure.
    """
    result = await db.execute(
        select(TelegramLinkCode).where(
            TelegramLinkCode.code == code.upper().strip(),
            TelegramLinkCode.used == False,
        )
    )
    link_code = result.scalar_one_or_none()

    if not link_code:
        return None

    # Check expiry
    if datetime.now(timezone.utc) > link_code.expires_at.replace(tzinfo=timezone.utc):
        return None

    # Check if chat_id is already linked to another account
    existing = await db.execute(
        select(TelegramLink).where(TelegramLink.telegram_chat_id == chat_id)
    )
    if existing.scalar_one_or_none():
        # Already linked — remove old link first, then re-link
        await db.execute(
            delete(TelegramLink).where(TelegramLink.telegram_chat_id == chat_id)
        )

    # Create the link
    telegram_link = TelegramLink(
        user_id=link_code.user_id,
        company_id=link_code.company_id,
        telegram_chat_id=chat_id,
        telegram_username=username,
    )
    db.add(telegram_link)

    # Mark code as used
    link_code.used = True
    await db.commit()

    # Return full user dict
    return await _build_user_dict(db, link_code.user_id)


async def _build_user_dict(db: AsyncSession, user_id) -> Optional[dict]:
    """Load a user from DB and return the same dict shape as auth.get_current_user."""
    result = await db.execute(
        select(User)
        .options(selectinload(User.company))
        .where(User.id == user_id, User.is_active == True)
    )
    user = result.scalar_one_or_none()
    if not user:
        return None
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "company_id": user.company_id,
        "company_name": user.company.name if user.company else None,
        "plan": user.company.plan if user.company else None,
        "is_superadmin": user.is_superadmin,
        "ai_questions_used": user.message_count,
    }


async def get_user_by_chat_id(
    db: AsyncSession,
    chat_id: int,
) -> Optional[dict]:
    """Look up the linked user for a Telegram chat_id. Returns user dict or None."""
    result = await db.execute(
        select(TelegramLink).where(TelegramLink.telegram_chat_id == chat_id)
    )
    link = result.scalar_one_or_none()
    if not link:
        return None
    return await _build_user_dict(db, link.user_id)


async def get_link_for_user(db: AsyncSession, user_id) -> Optional[TelegramLink]:
    """Return the TelegramLink row for a given user_id, or None."""
    result = await db.execute(
        select(TelegramLink).where(TelegramLink.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def unlink_by_chat_id(db: AsyncSession, chat_id: int) -> bool:
    """Remove a telegram link by chat_id. Returns True if a row was deleted."""
    result = await db.execute(
        delete(TelegramLink).where(TelegramLink.telegram_chat_id == chat_id)
    )
    await db.commit()
    return result.rowcount > 0


async def unlink_by_user_id(db: AsyncSession, user_id) -> bool:
    """Remove a telegram link by user_id. Returns True if a row was deleted."""
    result = await db.execute(
        delete(TelegramLink).where(TelegramLink.user_id == user_id)
    )
    await db.commit()
    return result.rowcount > 0


# ── Conversation history ──────────────────────────────────────────────────────

async def save_message(db: AsyncSession, chat_id: int, role: str, content: str) -> None:
    """Persist a message to telegram_messages."""
    msg = TelegramMessage(
        telegram_chat_id=chat_id,
        role=role,
        content=content,
    )
    db.add(msg)
    await db.commit()


async def get_history(db: AsyncSession, chat_id: int) -> list[dict]:
    """
    Return the last MAX_HISTORY messages for a chat as
    [{"role": "user"|"assistant", "content": "..."}].
    Ordered oldest-first (ready to pass to Claude).
    """
    result = await db.execute(
        select(TelegramMessage)
        .where(TelegramMessage.telegram_chat_id == chat_id)
        .order_by(TelegramMessage.created_at.desc())
        .limit(MAX_HISTORY)
    )
    messages = result.scalars().all()
    # Reverse to chronological order
    return [{"role": m.role, "content": m.content} for m in reversed(messages)]


async def clear_history(db: AsyncSession, chat_id: int) -> None:
    """Delete all conversation history for a chat (e.g. on /nuevo command)."""
    await db.execute(
        delete(TelegramMessage).where(TelegramMessage.telegram_chat_id == chat_id)
    )
    await db.commit()
