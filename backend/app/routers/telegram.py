"""
Telegram webhook router.

Receives updates from Telegram, resolves the linked user,
runs the Sol agent loop, and replies.

Commands supported:
  /start         — welcome + linking instructions
  /vincular CODE — link Telegram account to Solar ERP user
  /desvincular   — unlink this Telegram chat from the account
  /nuevo         — clear conversation history and start fresh
  Any other text — routed to Sol agent
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.database import get_db
from app.models.budget import Budget, BudgetItem
from app.models.client import Client
from app.models.installation import Installation
from app.models.company import Company
from app.services import telegram_service as tg
from app.services.agent.chat_service import run_agent_chat
from app.services.budget_pdf_service import generate_budget_pdf
from app.services.plan_limits import is_within_limit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhook", tags=["Telegram Webhook"])

# ── Helpers ───────────────────────────────────────────────────────────────────

WELCOME_MSG = (
    "👋 ¡Hola! Soy *Sol* ☀️, el asistente de inteligencia artificial de Solar ERP.\n\n"
    "Para empezar, necesito vincular tu cuenta:\n\n"
    "1️⃣ Ingresá a la app web → *Configuración* → sección *Telegram*\n"
    "2️⃣ Hacé clic en *Generar Código*\n"
    "3️⃣ Enviame el código con el comando:\n"
    "   `/vincular TUCODIGO`\n\n"
    "Una vez vinculado podés preguntarme lo que quieras sobre tus instalaciones, "
    "clientes, inventario y más. 🚀"
)

NOT_LINKED_MSG = (
    "🔒 Tu cuenta de Telegram no está vinculada a Solar ERP.\n\n"
    "Usá `/start` para ver las instrucciones de vinculación."
)

PLAN_LIMIT_MSG = (
    "⚠️ Alcanzaste el límite de preguntas de tu plan Demo.\n"
    "Actualizá a Pro desde *Configuración → Tu Plan* en la app web para seguir usando Sol."
)


def _extract_update(body: dict) -> tuple[Optional[int], Optional[str], Optional[str]]:
    """
    Parse a Telegram Update and return (chat_id, text, username).
    Returns (None, None, None) if the update doesn't contain a text message.
    """
    message = body.get("message") or body.get("edited_message")
    if not message:
        return None, None, None
    chat_id: Optional[int] = message.get("chat", {}).get("id")
    text: Optional[str] = message.get("text")
    username: Optional[str] = message.get("from", {}).get("username")
    return chat_id, text, username


# ── Webhook endpoint ──────────────────────────────────────────────────────────

@router.post("/telegram")
async def telegram_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_telegram_bot_api_secret_token: Optional[str] = Header(None),
):
    """Receive and process a Telegram Update."""
    settings = get_settings()

    # 1. Verify webhook secret
    if settings.telegram_webhook_secret:
        if x_telegram_bot_api_secret_token != settings.telegram_webhook_secret:
            raise HTTPException(status_code=403, detail="Invalid webhook secret")

    if not settings.telegram_bot_token:
        logger.warning("Telegram bot token not configured — ignoring update")
        return {"ok": True}

    body = await request.json()
    chat_id, text, username = _extract_update(body)

    if chat_id is None or not text:
        return {"ok": True}   # Ignore non-text updates (stickers, etc.)

    token = settings.telegram_bot_token
    text = text.strip()

    # ── /start ────────────────────────────────────────────────────────────────
    if text.lower().startswith("/start"):
        await tg.send_message(token, chat_id, WELCOME_MSG)
        return {"ok": True}

    # ── /vincular CODE ────────────────────────────────────────────────────────
    if text.lower().startswith("/vincular"):
        parts = text.split(maxsplit=1)
        if len(parts) < 2 or not parts[1].strip():
            await tg.send_message(
                token, chat_id,
                "❌ Necesito el código. Usá: `/vincular TUCODIGO`"
            )
            return {"ok": True}

        code = parts[1].strip()
        user = await tg.verify_link_code(db, code, chat_id, username)

        if user:
            await tg.send_message(
                token, chat_id,
                f"✅ ¡Listo, *{user['full_name']}*! Tu cuenta de Solar ERP está vinculada.\n\n"
                "Ahora podés preguntarme lo que necesites. Por ejemplo:\n"
                "• _¿Cuántas instalaciones tenemos activas?_\n"
                "• _Mostrá los clientes con mantenimiento pendiente_\n"
                "• _Creá un presupuesto para..._"
            )
        else:
            await tg.send_message(
                token, chat_id,
                "❌ Código inválido o expirado. Generá uno nuevo desde *Configuración → Telegram* en la app web."
            )
        return {"ok": True}

    # ── /desvincular ──────────────────────────────────────────────────────────
    if text.lower().startswith("/desvincular"):
        removed = await tg.unlink_by_chat_id(db, chat_id)
        if removed:
            await tg.clear_history(db, chat_id)
            await tg.send_message(
                token, chat_id,
                "✅ Tu cuenta fue desvinculada. Usá `/start` si querés volver a vincularla."
            )
        else:
            await tg.send_message(token, chat_id, "No había ninguna cuenta vinculada a este chat.")
        return {"ok": True}

    # ── /nuevo — clear history ────────────────────────────────────────────────
    if text.lower().startswith("/nuevo"):
        await tg.clear_history(db, chat_id)
        await tg.send_message(token, chat_id, "🔄 Historial borrado. ¡Empecemos de nuevo!")
        return {"ok": True}

    # ── Normal message → Sol agent ────────────────────────────────────────────

    # Resolve user
    current_user = await tg.get_user_by_chat_id(db, chat_id)
    if not current_user:
        await tg.send_message(token, chat_id, NOT_LINKED_MSG)
        return {"ok": True}

    # Check plan limits (non-blocking — we show a friendly message instead of 429)
    within_limit = await is_within_limit(db, current_user, "ai_questions")
    if not within_limit:
        await tg.send_message(token, chat_id, PLAN_LIMIT_MSG)
        return {"ok": True}

    # Send typing indicator
    await tg.send_typing(token, chat_id)

    # Load history
    history = await tg.get_history(db, chat_id)

    # Run Sol
    try:
        response_text, tool_calls_log = await run_agent_chat(
            message=text,
            history=history,
            current_user=current_user,
            db=db,
        )
    except Exception as e:
        logger.error(f"Telegram agent error for chat {chat_id}: {e}")
        await tg.send_message(
            token, chat_id,
            "⚠️ Ocurrió un error al procesar tu mensaje. Por favor intentá de nuevo."
        )
        return {"ok": True}

    # Persist both sides of the conversation
    await tg.save_message(db, chat_id, "user", text)
    await tg.save_message(db, chat_id, "assistant", response_text)

    # Reply with Sol's text first
    await tg.send_message(token, chat_id, response_text)

    # ── Auto-send PDF if a budget was just created ────────────────────────────
    budget_created = any(tc.get("tool") == "create_budget" for tc in tool_calls_log)
    if budget_created:
        try:
            # Fetch the most recent budget created by this user
            result = await db.execute(
                select(Budget)
                .options(selectinload(Budget.items).selectinload(BudgetItem.product))
                .where(Budget.created_by == current_user["id"])
                .order_by(Budget.created_at.desc())
                .limit(1)
            )
            budget = result.scalar_one_or_none()

            if budget:
                # Load related client, installation, company
                client = None
                if budget.client_id:
                    r = await db.execute(select(Client).where(Client.id == budget.client_id))
                    client = r.scalar_one_or_none()

                installation = None
                if budget.installation_id:
                    r = await db.execute(select(Installation).where(Installation.id == budget.installation_id))
                    installation = r.scalar_one_or_none()

                r = await db.execute(select(Company).where(Company.id == budget.company_id))
                company = r.scalar_one_or_none()

                pdf_bytes = generate_budget_pdf(budget, client, installation, company)
                filename = f"{budget.budget_number or 'presupuesto'}.pdf"

                await tg.send_typing(token, chat_id)
                await tg.send_document(
                    token,
                    chat_id,
                    pdf_bytes,
                    filename,
                    caption=f"📄 {filename}",
                )
        except Exception as e:
            logger.error(f"Failed to send budget PDF to Telegram chat {chat_id}: {e}")
            # Don't surface this error to the user — text reply already sent

    return {"ok": True}


# ── Setup endpoint (call once to register webhook with Telegram) ───────────────

@router.post("/telegram/setup")
async def setup_telegram_webhook(
    webhook_url: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Register the webhook URL with Telegram.
    Call this once after deployment with the public URL of your backend.
    Example body: {"webhook_url": "https://yourdomain.com/api/v1/webhook/telegram"}
    """
    settings = get_settings()
    if not settings.telegram_bot_token:
        raise HTTPException(status_code=503, detail="TELEGRAM_BOT_TOKEN not configured")

    result = await tg.set_webhook(
        settings.telegram_bot_token,
        webhook_url,
        settings.telegram_webhook_secret,
    )
    return result
