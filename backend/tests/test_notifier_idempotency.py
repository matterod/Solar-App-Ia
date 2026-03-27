"""
T6.5 — Integration test for send_daily_reminders idempotency (maintenance block).

Goal: calling _remind_maintenance twice in a row for a maintenance due in 7 days
must only send ONE message. The second call sees last_notification_days_before=7
already set and must skip.

Strategy:
- Mock db.execute to return a fake Maintenance object.
- Mock _get_company_links to return a fake TelegramLink (decouples from call ordering).
- Mock tg.send_message to capture sends without hitting Telegram.
"""

import uuid
from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.notifier import _remind_maintenance
from app.models.telegram import TelegramLink


# ── Fake model builders ────────────────────────────────────────────────────────

def _fake_maintenance(scheduled_date: date, last_notification: int | None = None):
    """Return a MagicMock that behaves like a Maintenance ORM object."""
    m = MagicMock()
    m.id = uuid.uuid4()
    m.company_id = uuid.uuid4()
    m.scheduled_date = scheduled_date
    m.last_notification_days_before = last_notification
    m.status = "scheduled"
    m.installation = MagicMock()
    m.installation.location_name = "Planta Solar Norte"
    m.installation_id = uuid.uuid4()
    return m


def _fake_link(company_id):
    """Return a MagicMock TelegramLink."""
    link = MagicMock(spec=TelegramLink)
    link.company_id = company_id
    link.telegram_chat_id = 123456789
    return link


def _db_returning(maintenance_obj):
    """Return an AsyncMock DB session whose execute() yields the given maintenance."""
    db = AsyncMock()
    db.commit = AsyncMock()

    execute_result = MagicMock()
    execute_result.scalars.return_value.all.return_value = [maintenance_obj]
    db.execute.return_value = execute_result

    return db


# ── Tests ──────────────────────────────────────────────────────────────────────

class TestNotifierIdempotency:
    """Verify that _remind_maintenance only sends once per threshold per event."""

    @pytest.mark.asyncio
    async def test_second_call_skips_when_threshold_already_set(self):
        """
        Scenario: maintenance is 7 days away.
        First call  → message is sent, last_notification_days_before becomes 7.
        Second call → field already equals threshold, message is NOT re-sent.
        """
        today = date.today()
        scheduled = today + timedelta(days=7)
        maintenance = _fake_maintenance(scheduled, last_notification=None)
        links = [_fake_link(maintenance.company_id)]

        token = "fake-bot-token"

        with (
            patch(
                "app.services.notifier._get_company_links",
                new_callable=AsyncMock,
                return_value=links,
            ),
            patch(
                "app.services.notifier.tg.send_message",
                new_callable=AsyncMock,
            ) as mock_send,
        ):
            # --- First call ---
            db1 = _db_returning(maintenance)
            sent1: list[int] = []
            errors1: list[int] = []
            await _remind_maintenance(db1, token, today, sent1, errors1)

            # Handler must have set the dedup field
            assert maintenance.last_notification_days_before == 7
            assert mock_send.call_count == 1
            assert len(sent1) == 1

            # --- Second call (same maintenance, field now == 7) ---
            db2 = _db_returning(maintenance)
            sent2: list[int] = []
            errors2: list[int] = []
            await _remind_maintenance(db2, token, today, sent2, errors2)

            # send_message must still have been called only once in total
            assert mock_send.call_count == 1
            assert len(sent2) == 0

    @pytest.mark.asyncio
    async def test_first_call_sends_message_at_threshold_7(self):
        """Sanity: when last_notification_days_before is None, message IS sent."""
        today = date.today()
        scheduled = today + timedelta(days=7)
        maintenance = _fake_maintenance(scheduled, last_notification=None)
        links = [_fake_link(maintenance.company_id)]

        token = "fake-bot-token"

        with (
            patch(
                "app.services.notifier._get_company_links",
                new_callable=AsyncMock,
                return_value=links,
            ),
            patch(
                "app.services.notifier.tg.send_message",
                new_callable=AsyncMock,
            ) as mock_send,
        ):
            db = _db_returning(maintenance)
            sent: list[int] = []
            errors: list[int] = []
            await _remind_maintenance(db, token, today, sent, errors)

        assert mock_send.call_count == 1
        assert len(sent) == 1
        assert len(errors) == 0

    @pytest.mark.asyncio
    async def test_non_threshold_day_does_not_send(self):
        """When days_until is 5 (not in THRESHOLDS=[7,3,1,0]), no message is sent."""
        today = date.today()
        scheduled = today + timedelta(days=5)
        maintenance = _fake_maintenance(scheduled, last_notification=None)

        token = "fake-bot-token"

        with (
            patch(
                "app.services.notifier._get_company_links",
                new_callable=AsyncMock,
            ) as mock_links,
            patch(
                "app.services.notifier.tg.send_message",
                new_callable=AsyncMock,
            ) as mock_send,
        ):
            db = _db_returning(maintenance)
            sent: list[int] = []
            errors: list[int] = []
            await _remind_maintenance(db, token, today, sent, errors)

        mock_send.assert_not_called()
        mock_links.assert_not_called()  # short-circuits before fetching links
        assert len(sent) == 0

    @pytest.mark.asyncio
    async def test_threshold_3_days(self):
        """Threshold at 3 days also triggers a send."""
        today = date.today()
        scheduled = today + timedelta(days=3)
        maintenance = _fake_maintenance(scheduled, last_notification=None)
        links = [_fake_link(maintenance.company_id)]

        token = "fake-bot-token"

        with (
            patch(
                "app.services.notifier._get_company_links",
                new_callable=AsyncMock,
                return_value=links,
            ),
            patch(
                "app.services.notifier.tg.send_message",
                new_callable=AsyncMock,
            ) as mock_send,
        ):
            db = _db_returning(maintenance)
            sent: list[int] = []
            errors: list[int] = []
            await _remind_maintenance(db, token, today, sent, errors)

        assert mock_send.call_count == 1
        assert maintenance.last_notification_days_before == 3
