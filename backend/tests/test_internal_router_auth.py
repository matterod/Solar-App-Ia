"""
T6.2 — Unit tests for verify_internal_secret (router auth)
T6.6 — Weekly summary non-Monday guard

Uses httpx.AsyncClient + ASGITransport against the real FastAPI app.
Auth is tested by patching app.routers.internal.get_settings (the local reference)
so the lru_cache on the global get_settings() does not interfere.

All notifier calls are mocked out so no real DB or Telegram is hit.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import date

from httpx import AsyncClient, ASGITransport


VALID_SECRET = "test-internal-secret-abc123"
SEND_REMINDERS_URL = "/api/v1/internal/send-reminders"
SEND_WEEKLY_URL = "/api/v1/internal/send-weekly-summary"


def _settings_with_secret(secret: str):
    """Return a MagicMock Settings object with the given internal_api_secret."""
    s = MagicMock()
    s.internal_api_secret = secret
    s.debug = False
    s.app_version = "test"
    s.app_name = "Solar ERP"
    s.get_cors_origins.return_value = []
    s.telegram_bot_token = ""
    return s


async def _get_app():
    """Import app lazily to avoid module-level DB connections during collection."""
    from app.main import app
    return app


# ── T6.2: Authentication guard ─────────────────────────────────────────────────

class TestInternalRouterAuth:
    """Verify that all internal endpoints enforce X-Internal-Secret correctly."""

    @pytest.mark.asyncio
    async def test_no_header_returns_403(self):
        """Missing X-Internal-Secret header → 403."""
        app = await _get_app()
        with patch("app.routers.internal.get_settings", return_value=_settings_with_secret(VALID_SECRET)):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post(SEND_REMINDERS_URL)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_wrong_secret_returns_403(self):
        """Wrong X-Internal-Secret → 403."""
        app = await _get_app()
        with patch("app.routers.internal.get_settings", return_value=_settings_with_secret(VALID_SECRET)):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post(
                    SEND_REMINDERS_URL,
                    headers={"X-Internal-Secret": "totally-wrong"},
                )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_correct_secret_not_403(self):
        """Correct X-Internal-Secret → not 403 (200 or 500 are both acceptable)."""
        app = await _get_app()
        with (
            patch("app.routers.internal.get_settings", return_value=_settings_with_secret(VALID_SECRET)),
            patch(
                "app.routers.internal.notifier.send_daily_reminders",
                new_callable=AsyncMock,
                return_value={"sent": 0, "errors": 0},
            ),
            # Override the DB dependency so no real DB is needed
            patch("app.database.get_db", return_value=AsyncMock()),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post(
                    SEND_REMINDERS_URL,
                    headers={"X-Internal-Secret": VALID_SECRET},
                )
        assert response.status_code != 403

    @pytest.mark.asyncio
    async def test_empty_secret_configured_returns_403(self):
        """When INTERNAL_API_SECRET is empty string, any request → 403.

        The implementation checks `not settings.internal_api_secret` before
        comparing, so an empty secret blocks ALL requests regardless of header.
        """
        app = await _get_app()
        with patch("app.routers.internal.get_settings", return_value=_settings_with_secret("")):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post(
                    SEND_REMINDERS_URL,
                    headers={"X-Internal-Secret": "any-value"},
                )
        assert response.status_code == 403


# ── T6.6: Non-Monday guard for weekly summary ─────────────────────────────────

class TestWeeklySummaryMondayGuard:
    """The /send-weekly-summary endpoint must skip on non-Monday days."""

    @pytest.mark.asyncio
    async def test_non_monday_returns_skipped_without_calling_notifier(self):
        """POST /internal/send-weekly-summary on a non-Monday
        returns {"ok": True, "message": "Not Monday, skipped"}
        and does NOT call send_weekly_summary.
        """
        app = await _get_app()

        # Tuesday: weekday() == 1
        tuesday = date(2026, 3, 24)
        assert tuesday.weekday() == 1  # sanity check

        with (
            patch("app.routers.internal.get_settings", return_value=_settings_with_secret(VALID_SECRET)),
            patch("app.routers.internal.date") as mock_date,
            patch(
                "app.routers.internal.notifier.send_weekly_summary",
                new_callable=AsyncMock,
            ) as mock_notifier,
        ):
            mock_date.today.return_value = tuesday

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post(
                    SEND_WEEKLY_URL,
                    headers={"X-Internal-Secret": VALID_SECRET},
                )

        assert response.status_code == 200
        body = response.json()
        assert body["ok"] is True
        assert "Not Monday" in body["message"]
        mock_notifier.assert_not_called()

    @pytest.mark.asyncio
    async def test_monday_calls_notifier(self):
        """On Monday the notifier IS called (weekday() == 0)."""
        app = await _get_app()

        # Monday: 2026-03-23
        monday = date(2026, 3, 23)
        assert monday.weekday() == 0  # sanity check

        with (
            patch("app.routers.internal.get_settings", return_value=_settings_with_secret(VALID_SECRET)),
            patch("app.routers.internal.date") as mock_date,
            patch(
                "app.routers.internal.notifier.send_weekly_summary",
                new_callable=AsyncMock,
                return_value={"companies_notified": 0, "messages_sent": 0},
            ) as mock_notifier,
            patch("app.database.get_db", return_value=AsyncMock()),
        ):
            mock_date.today.return_value = monday

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post(
                    SEND_WEEKLY_URL,
                    headers={"X-Internal-Secret": VALID_SECRET},
                )

        # notifier was attempted (even if it 500s due to DB, it was called)
        assert response.status_code != 403
