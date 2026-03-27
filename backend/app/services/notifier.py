"""
Notifier service — proactive Telegram reminders and weekly summaries.

Two public entry points:
  - send_daily_reminders(db)  → maintenance + deadline task + recurring task alerts
  - send_weekly_summary(db)   → per-company weekly digest sent every Monday
"""

import logging
from datetime import date, datetime, timedelta

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.models.activity import Activity
from app.models.budget import Budget
from app.models.installation import Installation
from app.models.maintenance import Maintenance
from app.models.pending_task import PendingTask
from app.models.telegram import TelegramLink
from app.services import telegram_service as tg

logger = logging.getLogger(__name__)

# Notification thresholds (days before the event)
THRESHOLDS = [7, 3, 1, 0]


# ── Threshold helper ──────────────────────────────────────────────────────────

def _current_threshold(days_until: int) -> int | None:
    """Return the matching threshold for days_until, or None if no exact match.

    Only values in THRESHOLDS [7, 3, 1, 0] trigger a notification.
    Negative days_until (overdue) never triggers a new notification.
    """
    if days_until in THRESHOLDS:
        return days_until
    return None


# ── Internal helpers ──────────────────────────────────────────────────────────

async def _get_company_links(db: AsyncSession, company_id) -> list[TelegramLink]:
    """Return all TelegramLink rows for a given company_id."""
    result = await db.execute(
        select(TelegramLink).where(TelegramLink.company_id == company_id)
    )
    return list(result.scalars().all())


async def _send_to_company(
    token: str,
    links: list[TelegramLink],
    text: str,
    sent: list[int],
    errors: list[int],
) -> None:
    """Send text to every linked user in a company; tally sent/errors."""
    for link in links:
        try:
            await tg.send_message(token, link.telegram_chat_id, text)
            sent.append(1)
        except Exception as exc:
            logger.error(
                "Failed to send Telegram message to chat_id=%s: %s",
                link.telegram_chat_id,
                exc,
            )
            errors.append(1)


# ── Block 1: Maintenance reminders ───────────────────────────────────────────

async def _remind_maintenance(
    db: AsyncSession,
    token: str,
    today: date,
    sent: list[int],
    errors: list[int],
) -> None:
    """Send threshold-based reminders for upcoming maintenance events."""
    max_days = max(THRESHOLDS)  # 7
    cutoff = today + timedelta(days=max_days)

    result = await db.execute(
        select(Maintenance)
        .options(selectinload(Maintenance.installation))
        .where(
            Maintenance.status.notin_(["completed", "cancelled"]),
            Maintenance.scheduled_date.isnot(None),
            Maintenance.scheduled_date >= today,
            Maintenance.scheduled_date <= cutoff,
        )
    )
    maintenances = result.scalars().all()

    for m in maintenances:
        days_until = (m.scheduled_date - today).days
        threshold = _current_threshold(days_until)
        if threshold is None:
            continue
        if m.last_notification_days_before == threshold:
            continue  # already notified at this threshold today

        links = await _get_company_links(db, m.company_id)
        if not links:
            logger.warning(
                "No Telegram links for company_id=%s — skipping maintenance reminder",
                m.company_id,
            )
            continue

        installation_name = (
            m.installation.location_name if m.installation else str(m.installation_id)
        )
        scheduled_str = m.scheduled_date.strftime("%d/%m/%Y")

        if days_until == 0:
            days_label = "¡Hoy!"
        else:
            days_label = f"en {days_until} día{'s' if days_until != 1 else ''}"

        text = (
            f"⚠️ Recordatorio: el mantenimiento de *{installation_name}* "
            f"está programado para el {scheduled_str} ({days_label})."
        )

        await _send_to_company(token, links, text, sent, errors)

        # Update dedup field after successful send
        m.last_notification_days_before = threshold
        await db.commit()


# ── Block 2: Deadline task reminders ─────────────────────────────────────────

async def _remind_deadline_tasks(
    db: AsyncSession,
    token: str,
    today: date,
    sent: list[int],
    errors: list[int],
) -> None:
    """Send threshold-based reminders for upcoming deadline tasks."""
    max_days = max(THRESHOLDS)
    cutoff = today + timedelta(days=max_days)

    result = await db.execute(
        select(PendingTask).where(
            PendingTask.is_recurring == False,  # noqa: E712
            PendingTask.due_date.isnot(None),
            PendingTask.status.notin_(["completed", "cancelled"]),
            PendingTask.due_date >= today,
            PendingTask.due_date <= cutoff,
        )
    )
    tasks = result.scalars().all()

    for task in tasks:
        days_until = (task.due_date - today).days
        threshold = _current_threshold(days_until)
        if threshold is None:
            continue
        if task.last_notification_days_before == threshold:
            continue

        links = await _get_company_links(db, task.company_id)
        if not links:
            logger.warning(
                "No Telegram links for company_id=%s — skipping deadline task reminder",
                task.company_id,
            )
            continue

        due_str = task.due_date.strftime("%d/%m/%Y")

        if days_until == 0:
            days_label = "¡Hoy!"
        else:
            days_label = f"en {days_until} día{'s' if days_until != 1 else ''}"

        text = (
            f"📋 Tarea próxima: *{task.title}* — vence el {due_str} ({days_label}). "
            f"Respondé a Sol para marcarla como lista."
        )

        await _send_to_company(token, links, text, sent, errors)

        task.last_notification_days_before = threshold
        await db.commit()


# ── Block 3: Recurring task reminders ────────────────────────────────────────

async def _remind_recurring_tasks(
    db: AsyncSession,
    token: str,
    today: date,
    sent: list[int],
    errors: list[int],
) -> None:
    """Send daily reminders for pending recurring tasks, deduped by epoch day."""
    today_epoch = (today - date(1970, 1, 1)).days

    result = await db.execute(
        select(PendingTask).where(
            PendingTask.is_recurring == True,  # noqa: E712
            PendingTask.status == "pending",
        )
    )
    tasks = result.scalars().all()

    for task in tasks:
        if task.last_notification_days_before == today_epoch:
            continue  # already notified today

        links = await _get_company_links(db, task.company_id)
        if not links:
            logger.warning(
                "No Telegram links for company_id=%s — skipping recurring task reminder",
                task.company_id,
            )
            continue

        text = f"📋 Tarea pendiente: *{task.title}*"
        if task.description:
            text += f"\n{task.description}"
        text += "\nRespondé a Sol para marcarla como lista."

        await _send_to_company(token, links, text, sent, errors)

        task.last_notification_days_before = today_epoch
        await db.commit()


# ── Public: send_daily_reminders ─────────────────────────────────────────────

async def send_daily_reminders(db: AsyncSession) -> dict:
    """Run all three reminder checks and return sent/error counts.

    Covers:
      1. Maintenance events at threshold days (7, 3, 1, 0)
      2. Deadline tasks at threshold days
      3. Recurring tasks (daily, deduped by epoch day)

    Returns:
        {"sent": int, "errors": int}
    """
    settings = get_settings()
    token = settings.telegram_bot_token
    today = date.today()

    sent: list[int] = []
    errors: list[int] = []

    await _remind_maintenance(db, token, today, sent, errors)
    await _remind_deadline_tasks(db, token, today, sent, errors)
    await _remind_recurring_tasks(db, token, today, sent, errors)

    return {"sent": len(sent), "errors": len(errors)}


# ── Weekly summary helpers ────────────────────────────────────────────────────

def _monday_of_week(today: date) -> date:
    """Return the Monday of the current ISO week."""
    return today - timedelta(days=today.weekday())


def _build_weekly_summary(
    monday: date,
    installations: list[Installation],
    activity_count: int,
    budgets: list[Budget],
    upcoming_maintenance: list[Maintenance],
    upcoming_tasks: list[PendingTask],
) -> str:
    """Build the weekly summary message string for a single company."""
    monday_str = monday.strftime("%d/%m/%Y")

    lines: list[str] = [
        f"📊 *Resumen semanal — semana del {monday_str}*",
        "",
        f"🔧 *Instalaciones realizadas:* {len(installations)}",
    ]
    for inst in installations:
        client_name = inst.client.name if inst.client else "Cliente desconocido"
        lines.append(f"  • {client_name}")

    lines.append("")
    lines.append(f"📝 *Actividades registradas:* {activity_count}")

    lines.append("")
    lines.append(f"💼 *Presupuestos creados:* {len(budgets)}")
    for b in budgets:
        label = b.budget_number or b.title
        lines.append(f"  • {label}")

    lines.append("")
    lines.append("📅 *Próxima semana:*")
    if not upcoming_maintenance and not upcoming_tasks:
        lines.append("  • Sin eventos programados")
    else:
        for m in upcoming_maintenance:
            inst_name = m.installation.location_name if m.installation else str(m.installation_id)
            date_str = m.scheduled_date.strftime("%d/%m/%Y")
            lines.append(f"  • 🔧 Mantenimiento: {inst_name} ({date_str})")
        for t in upcoming_tasks:
            due_str = t.due_date.strftime("%d/%m/%Y") if t.due_date else "—"
            lines.append(f"  • 📋 Tarea: {t.title} ({due_str})")

    return "\n".join(lines)


# ── Public: send_weekly_summary ───────────────────────────────────────────────

async def send_weekly_summary(db: AsyncSession) -> dict:
    """Build and send a per-company weekly digest to all linked Telegram users.

    Returns:
        {"companies_notified": int, "messages_sent": int}
    """
    settings = get_settings()
    token = settings.telegram_bot_token
    today = date.today()
    monday = _monday_of_week(today)
    seven_days_ago = today - timedelta(days=7)
    seven_days_ahead = today + timedelta(days=7)
    seven_days_ago_dt = datetime.combine(seven_days_ago, datetime.min.time())

    # Gather all distinct company_ids that have at least one TelegramLink
    links_result = await db.execute(
        select(TelegramLink.company_id).distinct()
    )
    company_ids = [row[0] for row in links_result.all()]

    companies_notified = 0
    messages_sent = 0

    for company_id in company_ids:
        links = await _get_company_links(db, company_id)
        if not links:
            logger.warning(
                "No Telegram links for company_id=%s — skipping weekly summary",
                company_id,
            )
            continue

        # Installations created in last 7 days
        inst_result = await db.execute(
            select(Installation)
            .options(selectinload(Installation.client))
            .where(
                Installation.company_id == company_id,
                Installation.created_at >= seven_days_ago_dt,
            )
        )
        installations = list(inst_result.scalars().all())

        # Activities created in last 7 days (count only)
        act_result = await db.execute(
            select(func.count(Activity.id)).where(
                Activity.company_id == company_id,
                Activity.created_at >= seven_days_ago_dt,
            )
        )
        activity_count: int = act_result.scalar_one() or 0

        # Budgets created in last 7 days
        budget_result = await db.execute(
            select(Budget).where(
                Budget.company_id == company_id,
                Budget.created_at >= seven_days_ago_dt,
            )
        )
        budgets = list(budget_result.scalars().all())

        # Maintenance scheduled in next 7 days
        maint_result = await db.execute(
            select(Maintenance)
            .options(selectinload(Maintenance.installation))
            .where(
                Maintenance.company_id == company_id,
                Maintenance.status.notin_(["completed", "cancelled"]),
                Maintenance.scheduled_date >= today,
                Maintenance.scheduled_date <= seven_days_ahead,
            )
        )
        upcoming_maintenance = list(maint_result.scalars().all())

        # Pending tasks with due_date in next 7 days
        task_result = await db.execute(
            select(PendingTask).where(
                PendingTask.company_id == company_id,
                PendingTask.status == "pending",
                PendingTask.due_date.isnot(None),
                PendingTask.due_date >= today,
                PendingTask.due_date <= seven_days_ahead,
            )
        )
        upcoming_tasks = list(task_result.scalars().all())

        summary_text = _build_weekly_summary(
            monday=monday,
            installations=installations,
            activity_count=activity_count,
            budgets=budgets,
            upcoming_maintenance=upcoming_maintenance,
            upcoming_tasks=upcoming_tasks,
        )

        sent_count = 0
        for link in links:
            try:
                await tg.send_message(token, link.telegram_chat_id, summary_text)
                sent_count += 1
                messages_sent += 1
            except Exception as exc:
                logger.error(
                    "Failed to send weekly summary to chat_id=%s (company=%s): %s",
                    link.telegram_chat_id,
                    company_id,
                    exc,
                )

        if sent_count > 0:
            companies_notified += 1

    return {"companies_notified": companies_notified, "messages_sent": messages_sent}
