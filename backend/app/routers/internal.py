"""
Internal API router — machine-to-machine endpoints for Cloud Scheduler.

Endpoints:
  POST /internal/send-reminders      — trigger daily proactive reminders
  POST /internal/send-weekly-summary — trigger weekly company digest (Monday-only)

All endpoints are protected by the X-Internal-Secret header.
"""

import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.services import notifier

logger = logging.getLogger(__name__)


# ── Auth dependency ────────────────────────────────────────────────────────────

async def verify_internal_secret(
    x_internal_secret: Optional[str] = Header(None),
) -> None:
    """Verify the X-Internal-Secret header against INTERNAL_API_SECRET env var.

    Raises HTTP 403 if the secret is missing, empty, or does not match.
    """
    settings = get_settings()
    if not settings.internal_api_secret or x_internal_secret != settings.internal_api_secret:
        raise HTTPException(status_code=403, detail="Forbidden")


# ── Router ─────────────────────────────────────────────────────────────────────

router = APIRouter(
    prefix="/internal",
    tags=["Internal"],
    dependencies=[Depends(verify_internal_secret)],
)


# ── T3.2: POST /internal/send-reminders ───────────────────────────────────────

@router.post("/send-reminders")
async def send_reminders(db: AsyncSession = Depends(get_db)):
    """Trigger daily proactive reminders for maintenance, deadline tasks, and recurring tasks.

    Protected by X-Internal-Secret header.
    Returns {"ok": True, "message": "..."} on success, or {"ok": False, "error": "..."} on failure.
    """
    try:
        result = await notifier.send_daily_reminders(db)
        return {"ok": True, "message": "Daily reminders sent", **result}
    except Exception as exc:
        logger.error("send_reminders failed: %s", exc, exc_info=True)
        return JSONResponse(status_code=500, content={"ok": False, "error": str(exc)})


# ── T3.3: POST /internal/send-weekly-summary ─────────────────────────────────

@router.post("/send-weekly-summary")
async def send_weekly_summary(db: AsyncSession = Depends(get_db)):
    """Trigger the weekly company digest. Only executes on Monday; skips on other days.

    Protected by X-Internal-Secret header.
    Returns {"ok": True, "message": "..."} on success, or {"ok": False, "error": "..."} on failure.
    """
    # Defensive day-of-week check: 0 = Monday
    if date.today().weekday() != 0:
        return {"ok": True, "message": "Not Monday, skipped"}

    try:
        result = await notifier.send_weekly_summary(db)
        return {"ok": True, "message": "Weekly summary sent", **result}
    except Exception as exc:
        logger.error("send_weekly_summary failed: %s", exc, exc_info=True)
        return JSONResponse(status_code=500, content={"ok": False, "error": str(exc)})
