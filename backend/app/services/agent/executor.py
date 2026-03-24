"""
Executor for the Plan-and-Execute agent pipeline.

Pure Python — zero model calls.  Iterates plan steps, resolves ${var}
references from a context dict, calls execute_tool(), captures outputs,
and evaluates on_found / on_empty conditionals.
"""

import json
import logging
import re
from typing import Any

from app.services.agent.plan_types import StepResult
from app.services.agent.tool_registry import execute_tool, get_tool_catalog

logger = logging.getLogger(__name__)


def deep_replace_vars(obj: Any, context: dict) -> Any:
    """
    Recursively walk obj (str / dict / list) and replace ${var_name}
    placeholders with values from context.

    Raises KeyError if a referenced variable is not present in context.
    """
    if isinstance(obj, str):
        def _replace(match):
            var_name = match.group(1)
            if var_name not in context:
                raise KeyError(f"Undefined variable: ${{{var_name}}}")
            return str(context[var_name])

        return re.sub(r"\$\{(\w+)\}", _replace, obj)

    if isinstance(obj, dict):
        return {k: deep_replace_vars(v, context) for k, v in obj.items()}

    if isinstance(obj, list):
        return [deep_replace_vars(item, context) for item in obj]

    # int, float, bool, None — return as-is
    return obj


def dotted_get(data: Any, path: str) -> Any:
    """
    Resolve a dotted path on a nested dict/list structure.

    Example: dotted_get(data, "records.0.id") => data["records"][0]["id"]
    Integer path segments are auto-cast to int for list indexing.
    Returns None on any KeyError or IndexError.
    """
    current = data
    for segment in path.split("."):
        if current is None:
            return None
        try:
            # Try integer index for lists
            if isinstance(current, list):
                current = current[int(segment)]
            else:
                current = current[segment]
        except (KeyError, IndexError, ValueError, TypeError):
            return None
    return current


async def execute_plan(plan: dict, db, current_user: dict) -> list[StepResult]:
    """
    Execute a validated plan dict (mode="plan") step by step.

    Returns a list of StepResult, one per step (including skipped/errored).
    Stops on the first tool error and returns partial results.
    """
    results: list[StepResult] = []
    context: dict = {}
    skip_set: set[str] = set()

    # Pre-validate all tool names before executing anything
    known_names = {t["name"] for t in get_tool_catalog()}
    for step in plan.get("steps", []):
        if step.get("tool") not in known_names:
            logger.error(f"[executor] unknown tool '{step.get('tool')}' — aborting plan")
            results.append(StepResult(
                step_id=step.get("id", "unknown"),
                tool=step.get("tool", "unknown"),
                params=step.get("params", {}),
                result=json.dumps({"error": f"Unknown tool: {step.get('tool')}"}),
                skipped=False,
                error=True,
            ))
            return results

    for step in plan.get("steps", []):
        step_id = step.get("id", "unknown")
        tool_name = step["tool"]
        raw_params = step.get("params", {})

        # Skip if flagged by a prior on_found condition
        if step_id in skip_set:
            logger.info(f"[executor] step '{step_id}' skipped (in skip_set)")
            results.append(StepResult(
                step_id=step_id,
                tool=tool_name,
                params=raw_params,
                result="{}",
                skipped=True,
                error=None,
            ))
            continue

        # Resolve variable references
        try:
            params = deep_replace_vars(raw_params, context)
        except KeyError as e:
            logger.error(f"[executor] variable resolution failed at step '{step_id}': {e}")
            results.append(StepResult(
                step_id=step_id,
                tool=tool_name,
                params=raw_params,
                result=json.dumps({"error": str(e)}),
                skipped=False,
                error=True,
            ))
            break  # stop execution on missing variable

        # Execute the tool
        logger.info(f"[executor] step '{step_id}': {tool_name}({params})")
        raw_result = await execute_tool(tool_name, params, db, user=current_user)
        logger.debug(f"[executor] step '{step_id}' result: {raw_result[:300]}")

        # Best-effort JSON parse for conditional logic and capture
        try:
            parsed = json.loads(raw_result)
        except json.JSONDecodeError:
            parsed = {}

        # Check for error in result
        has_error = "error" in parsed

        # Handle capture
        capture_key = step.get("capture")
        capture_path = step.get("capture_path")
        if capture_key and capture_path and not has_error:
            captured_value = dotted_get(parsed, capture_path)
            context[capture_key] = captured_value
            logger.debug(f"[executor] captured '{capture_key}' = {captured_value}")

        # Handle on_found — skip a step if result has non-empty records
        on_found = step.get("on_found")
        if on_found:
            records = parsed.get("records", [])
            if isinstance(records, list) and len(records) > 0:
                skip_set.add(on_found)
                logger.info(f"[executor] on_found: adding '{on_found}' to skip_set")

        # Handle on_empty — stop if result has empty records
        on_empty = step.get("on_empty")
        if on_empty == "stop":
            records = parsed.get("records", [])
            if isinstance(records, list) and len(records) == 0:
                results.append(StepResult(
                    step_id=step_id,
                    tool=tool_name,
                    params=params,
                    result=raw_result,
                    skipped=False,
                    error=None,
                ))
                logger.info(f"[executor] on_empty=stop at step '{step_id}' — halting")
                break

        results.append(StepResult(
            step_id=step_id,
            tool=tool_name,
            params=params,
            result=raw_result,
            skipped=False,
            error=True if has_error else None,
        ))

        # Stop on tool error
        if has_error:
            logger.error(f"[executor] tool error at step '{step_id}' — halting execution")
            break

    return results
