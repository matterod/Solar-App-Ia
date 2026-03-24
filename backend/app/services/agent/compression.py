"""
Tool result compression utilities for the Sol agent loop.

Reduces token footprint of tool results stored in the messages list across
loop iterations, without losing the structured data Sol needs to reason.

Public API: compress_tool_result(tool_name, raw_result) -> str
"""

import json
import logging

logger = logging.getLogger(__name__)

_TRUNCATE_THRESHOLD = 2048  # bytes / chars
_TRUNCATE_TARGET = 1500


def _compress_search_records(raw):
    """Return compact summary of search_records JSON result."""
    parsed = json.loads(raw)
    records = parsed.get("records", [])
    count = parsed.get("count", len(records))

    # Extract id + one label field per record
    _LABEL_PRIORITY = ("name", "status", "description")
    compressed_records = []
    for rec in records:
        rec_id = rec.get("id")
        label_key = next(
            (k for k in _LABEL_PRIORITY if k in rec and rec[k] is not None),
            next((k for k in rec if k != "id"), None),
        )
        label_val = rec.get(label_key) if label_key else None
        if rec_id is not None:
            compressed_records.append({label_key or "id": label_val, "id": rec_id} if label_key else {"id": rec_id})
        else:
            compressed_records.append({label_key: label_val} if label_key else {})

    summary = f"search_records → {count} records: {json.dumps(compressed_records, ensure_ascii=False)}"
    # Guard against edge-case very long label values
    if len(summary) > 600:
        summary = summary[:590] + "…"
    return summary


def _compress_describe_database_schema(raw):
    """Return compact summary of describe_database_schema JSON result."""
    parsed = json.loads(raw)
    schema = parsed.get("schema", {})

    if len(schema) == 1:
        # Single-model query — result is already narrow, return as-is
        return raw

    # Multi-model (no filter): return table names only
    table_names = list(schema.keys())
    summary = f"describe_database_schema() → {len(table_names)} tables: {table_names}"
    if len(summary) > 300:
        summary = summary[:290] + "…"
    return summary


def _truncate(raw):
    """Truncate raw string to target length with a marker."""
    return raw[:_TRUNCATE_TARGET] + " [truncated]"


def compress_tool_result(tool_name, raw_result):
    """
    Compress a tool result string before storing in the messages list.

    Rules:
    - search_records: keep id + label field per record, include count
    - describe_database_schema (single model): passthrough (already narrow)
    - describe_database_schema (no model filter): keep table names only
    - any result < 2KB: return as-is
    - any result >= 2KB (unknown tool): truncate to 1500 chars + " [truncated]"

    Never raises — malformed JSON falls back to truncation.
    """
    logger.debug(f"[compress] tool={tool_name} raw_len={len(raw_result)} raw={raw_result[:300]}")

    try:
        if tool_name == "search_records":
            return _compress_search_records(raw_result)

        if tool_name == "describe_database_schema":
            return _compress_describe_database_schema(raw_result)

    except Exception as exc:
        logger.debug(f"[compress] parse error for {tool_name}, falling back to truncation: {exc}")

    # Fallback: passthrough if small, truncate if large
    if len(raw_result) < _TRUNCATE_THRESHOLD:
        return raw_result

    return _truncate(raw_result)
