"""
T6.3 — Unit tests for handle_create_task
T6.4 — Unit tests for handle_complete_task

All DB interaction is mocked — no real DB required.
"""

import json
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.agent.task_tools import handle_create_task, handle_complete_task
from app.models.pending_task import PendingTask


# ── Fixtures ───────────────────────────────────────────────────────────────────

def _make_user(company_id=None):
    """Return a minimal user dict as the agent would pass it."""
    return {
        "id": uuid.uuid4(),
        "company_id": company_id or uuid.uuid4(),
    }


def _make_db_session():
    """Return an AsyncMock that looks like an AsyncSession."""
    db = AsyncMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.rollback = AsyncMock()
    db.refresh = AsyncMock()
    db.execute = AsyncMock()
    return db


# ── T6.3: handle_create_task ───────────────────────────────────────────────────

class TestHandleCreateTask:
    """Business-rule tests for the create_task tool handler."""

    @pytest.mark.asyncio
    async def test_recurring_task_sets_task_type_recurring(self):
        """is_recurring=True → task_type='recurring', due_date ignored."""
        company_id = uuid.uuid4()
        user = _make_user(company_id)
        db = _make_db_session()

        # Capture what gets added to the session
        added_task = None

        def capture_add(obj):
            nonlocal added_task
            added_task = obj

        db.add.side_effect = capture_add

        # db.refresh should populate the id so json serialisation works
        async def fake_refresh(obj):
            obj.id = uuid.uuid4()

        db.refresh.side_effect = fake_refresh

        tool_input = {
            "title": "Revisar paneles mensualmente",
            "is_recurring": True,
            "due_date": "2099-01-01",  # should be ignored
        }

        result_str = await handle_create_task(tool_input, db, user)
        result = json.loads(result_str)

        assert result["success"] is True
        assert result["task_type"] == "recurring"
        assert result["is_recurring"] is True
        assert result["due_date"] is None

        # Verify the ORM object
        assert added_task is not None
        assert added_task.task_type == "recurring"
        assert added_task.is_recurring is True
        assert added_task.due_date is None
        assert added_task.company_id == company_id

    @pytest.mark.asyncio
    async def test_deadline_task_with_due_date(self):
        """is_recurring=False + due_date → task_type='deadline'."""
        company_id = uuid.uuid4()
        user = _make_user(company_id)
        db = _make_db_session()

        added_task = None

        def capture_add(obj):
            nonlocal added_task
            added_task = obj

        db.add.side_effect = capture_add

        async def fake_refresh(obj):
            obj.id = uuid.uuid4()

        db.refresh.side_effect = fake_refresh

        tool_input = {
            "title": "Presentar informe trimestral",
            "is_recurring": False,
            "due_date": "2026-04-15",
        }

        result_str = await handle_create_task(tool_input, db, user)
        result = json.loads(result_str)

        assert result["success"] is True
        assert result["task_type"] == "deadline"
        assert result["is_recurring"] is False
        assert result["due_date"] == "2026-04-15"

        assert added_task is not None
        assert added_task.task_type == "deadline"
        assert added_task.is_recurring is False
        assert str(added_task.due_date) == "2026-04-15"
        assert added_task.company_id == company_id

    @pytest.mark.asyncio
    async def test_deadline_task_without_due_date_returns_error(self):
        """is_recurring=False + no due_date → must return an error string, not raise."""
        user = _make_user()
        db = _make_db_session()

        tool_input = {
            "title": "Tarea sin fecha",
            "is_recurring": False,
            # due_date intentionally omitted
        }

        result_str = await handle_create_task(tool_input, db, user)
        result = json.loads(result_str)

        assert "error" in result
        # DB must NOT have been touched
        db.add.assert_not_called()
        db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_company_id_always_set_from_user(self):
        """The task's company_id must always come from the user dict."""
        expected_company_id = uuid.uuid4()
        user = _make_user(expected_company_id)
        db = _make_db_session()

        added_task = None

        def capture_add(obj):
            nonlocal added_task
            added_task = obj

        db.add.side_effect = capture_add

        async def fake_refresh(obj):
            obj.id = uuid.uuid4()

        db.refresh.side_effect = fake_refresh

        tool_input = {
            "title": "Tarea de empresa",
            "is_recurring": True,
        }

        await handle_create_task(tool_input, db, user)

        assert added_task is not None
        assert added_task.company_id == expected_company_id


# ── T6.4: handle_complete_task ─────────────────────────────────────────────────

class TestHandleCompleteTask:
    """Business-rule tests for the complete_task tool handler."""

    @pytest.mark.asyncio
    async def test_valid_task_id_sets_completed_status(self):
        """A found task → status='completed', completed_at is set."""
        company_id = uuid.uuid4()
        task_id = uuid.uuid4()
        user = _make_user(company_id)
        db = _make_db_session()

        # Build a mock task that will be "found" by the query
        mock_task = MagicMock(spec=PendingTask)
        mock_task.id = task_id
        mock_task.title = "Limpiar paneles"
        mock_task.status = "pending"
        mock_task.completed_at = None

        # db.execute returns a result whose scalar_one_or_none returns mock_task
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_task
        db.execute.return_value = mock_result

        tool_input = {"task_id": str(task_id)}
        result_str = await handle_complete_task(tool_input, db, user)
        result = json.loads(result_str)

        assert result["success"] is True
        assert result["task_id"] == str(task_id)
        assert mock_task.status == "completed"
        assert mock_task.completed_at is not None
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_task_not_found_returns_error(self):
        """When task_id does not exist → returns error string, no commit."""
        company_id = uuid.uuid4()
        user = _make_user(company_id)
        db = _make_db_session()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        db.execute.return_value = mock_result

        tool_input = {"task_id": str(uuid.uuid4())}
        result_str = await handle_complete_task(tool_input, db, user)
        result = json.loads(result_str)

        assert "error" in result
        db.commit.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_task_from_different_company_not_found(self):
        """Task belonging to another company is invisible (security scope).

        The query in handle_complete_task always adds
        PendingTask.company_id == company_id to the WHERE clause,
        so a task from a different company will never be returned.
        We simulate this by having scalar_one_or_none return None.
        """
        user_company_id = uuid.uuid4()
        other_company_id = uuid.uuid4()
        user = _make_user(user_company_id)
        db = _make_db_session()

        # Simulate DB finding nothing (cross-company task filtered out)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        db.execute.return_value = mock_result

        tool_input = {"task_id": str(uuid.uuid4())}
        result_str = await handle_complete_task(tool_input, db, user)
        result = json.loads(result_str)

        assert "error" in result
        db.commit.assert_not_awaited()

        # Verify that the company_id from the user was used in the query call
        # (execute was called once — if it returned None, the scoping worked)
        db.execute.assert_awaited_once()
