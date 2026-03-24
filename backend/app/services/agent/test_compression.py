"""
Tests for compress_tool_result() in compression.py.

All tests exercise the pure function directly — no I/O, no DB, no mocking needed.
"""

import json
import pytest

from app.services.agent.compression import compress_tool_result
from app.services.agent.tool_registry import get_tools


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_search_result(n: int, *, include_count: bool = True) -> str:
    """Build a realistic search_records JSON payload with n records."""
    records = [{"id": i, "name": f"Cliente {i}", "status": "active"} for i in range(1, n + 1)]
    payload = {"records": records}
    if include_count:
        payload["count"] = n
    return json.dumps(payload)


def _make_schema_result(model_names: list[str]) -> str:
    """Build a describe_database_schema JSON payload for the given model names."""
    schema = {
        name: {
            "columns": {"id": "integer", "name": "varchar"},
            "relationships": [],
        }
        for name in model_names
    }
    return json.dumps({"schema": schema})


# ── 3.1 search_records — large result is compressed ───────────────────────────

def test_search_records_compresses_large_result():
    """10+ records → output has count + ids, NOT full record bodies."""
    raw = _make_search_result(10)
    result = compress_tool_result("search_records", raw)

    # Must start with the known prefix
    assert result.startswith("search_records →")

    # Must include the count
    assert "10 records" in result

    # Must contain all record ids
    for i in range(1, 11):
        assert str(i) in result

    # Must NOT contain long field values that were stripped (full JSON sub-objects)
    # The full record body {"id": 1, "name": "Cliente 1", "status": "active"} is gone;
    # only the compressed {id, label} pairs remain.
    assert '"status": "active"' not in result

    # Total length must respect the 600-char guard
    assert len(result) <= 600


def test_search_records_output_format_matches_spec():
    """Verify the exact prefix format: 'search_records → N records: [...]'."""
    raw = _make_search_result(3)
    result = compress_tool_result("search_records", raw)

    assert result.startswith("search_records → 3 records:")
    # The rest should be a JSON-serialisable list snippet
    assert "[" in result


# ── 3.2 search_records — empty result does not crash ─────────────────────────

def test_search_records_empty_returns_summary_without_crash():
    """0 records → clean empty-list summary, no exception."""
    raw = json.dumps({"records": [], "count": 0})
    result = compress_tool_result("search_records", raw)

    assert "0 records" in result
    assert "[]" in result


def test_search_records_missing_count_falls_back_to_len():
    """If 'count' key is absent, len(records) is used instead."""
    raw = _make_search_result(5, include_count=False)
    result = compress_tool_result("search_records", raw)

    assert "5 records" in result


# ── 3.3 describe_database_schema — single model is passthrough ───────────────

def test_describe_database_schema_single_model_passthrough():
    """Single-model query → full schema preserved (returned as-is)."""
    raw = _make_schema_result(["Client"])
    result = compress_tool_result("describe_database_schema", raw)

    assert result == raw


# ── 3.4 describe_database_schema — multi-model returns table names only ───────

def test_describe_database_schema_multi_model_returns_table_names_only():
    """No model filter (multiple models) → only table names, no column details."""
    models = ["Client", "Installation", "Product", "Maintenance"]
    raw = _make_schema_result(models)
    result = compress_tool_result("describe_database_schema", raw)

    # Must contain the count and table names
    assert "4 tables" in result
    for name in models:
        assert name in result

    # Must NOT contain column-level details
    assert '"columns"' not in result
    assert '"relationships"' not in result

    # Must respect the 300-char guard
    assert len(result) <= 300


def test_describe_database_schema_multi_model_prefix():
    """Verify the exact prefix: 'describe_database_schema() → N tables:'."""
    raw = _make_schema_result(["A", "B"])
    result = compress_tool_result("describe_database_schema", raw)

    assert result.startswith("describe_database_schema() →")
    assert "2 tables" in result


# ── 3.5 Unknown tool — result < 2 KB is passed through unchanged ──────────────

def test_unknown_tool_small_result_passthrough():
    """Unknown tool + result under 2048 chars → returned unchanged."""
    raw = '{"status": "ok", "data": "short payload"}'
    result = compress_tool_result("some_other_tool", raw)

    assert result == raw


def test_unknown_tool_exactly_below_threshold_passthrough():
    """Result of exactly 2047 chars (< 2048) → passthrough, no truncation."""
    raw = "x" * 2047
    result = compress_tool_result("unknown_tool", raw)

    assert result == raw
    assert "[truncated]" not in result


# ── 3.6 Unknown tool — result ≥ 2 KB is truncated ────────────────────────────

def test_unknown_tool_large_result_truncated():
    """Result of exactly 2048 chars (≥ threshold) → truncated to ≤ 1511 chars with marker."""
    raw = "y" * 2048
    result = compress_tool_result("unknown_tool", raw)

    assert result.endswith(" [truncated]")
    # 1500 content chars + len(" [truncated]") == 11 → total 1511
    assert len(result) <= 1511


def test_unknown_tool_very_large_result_truncated_to_target():
    """Huge result → first 1500 chars preserved exactly, then ' [truncated]'."""
    raw = "z" * 10_000
    result = compress_tool_result("unknown_tool", raw)

    assert result == "z" * 1500 + " [truncated]"


# ── 3.7 Malformed JSON — never raises, returns something usable ───────────────

def test_search_records_malformed_json_does_not_raise():
    """Malformed JSON for search_records → no exception, falls back gracefully."""
    raw = "this is not json at all"
    result = compress_tool_result("search_records", raw)  # must not raise

    # Since raw is 23 chars (< 2048), fallback returns raw as-is
    assert result == raw


def test_describe_database_schema_malformed_json_does_not_raise():
    """Malformed JSON for describe_database_schema → no exception."""
    raw = "{broken json: [}"
    result = compress_tool_result("describe_database_schema", raw)

    # Must not raise; result is either raw (small) or truncated (large)
    assert isinstance(result, str)
    assert len(result) > 0


def test_search_records_malformed_json_large_falls_back_to_truncation():
    """Malformed JSON that is >= 2KB → falls back to truncation, no exception."""
    raw = "not-json-" + "x" * 2100
    result = compress_tool_result("search_records", raw)

    assert result.endswith(" [truncated]")
    assert len(result) <= 1511


# ── 3.8 BONUS: get_tools() registry is NOT mutated by call-site caching ───────

def test_get_tools_last_schema_has_no_cache_control():
    """
    get_tools() returns fresh dicts each call — cache_control is NEVER present
    in registry schemas.  The mutation in chat_service.py is local (call-site only).
    """
    tools_a = get_tools()
    tools_b = get_tools()

    # Neither call should have cache_control on any schema
    for schema in tools_a:
        assert "cache_control" not in schema, (
            f"Tool '{schema['name']}' has cache_control in registry — "
            "mutation must stay at call-site in chat_service.py"
        )
    for schema in tools_b:
        assert "cache_control" not in schema


def test_get_tools_registry_not_mutated_after_chat_service_pattern():
    """
    Simulate the chat_service.py mutation pattern and confirm subsequent
    calls to get_tools() still return clean schemas.
    """
    tools = get_tools()
    # Apply the same mutation that chat_service.py uses
    mutated = tools[:-1] + [{**tools[-1], "cache_control": {"type": "ephemeral"}}]

    # Confirm the mutation worked on the local copy
    assert mutated[-1].get("cache_control") == {"type": "ephemeral"}

    # Confirm the registry was NOT affected
    tools_after = get_tools()
    assert "cache_control" not in tools_after[-1]
