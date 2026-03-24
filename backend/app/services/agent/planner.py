"""
Planner for the Plan-and-Execute agent pipeline.

build_plan() makes a single Haiku call with a stripped tool catalog
(names + descriptions only — no schemas) and returns a validated JSON
execution plan, or {"mode": "reactive"} when the request is open-ended
or the plan cannot be validated.
"""

import json
import logging

import anthropic

from app.services.agent.tool_registry import get_tool_catalog

logger = logging.getLogger(__name__)

PLANNER_PROMPT = """You are a planning agent for a solar ERP system used in Argentina.
User requests arrive in Rioplatense Spanish (e.g. "creá un cliente", "registrá una instalación").
Given a user request and the available tools list, return a JSON execution plan.
For open-ended or ambiguous requests that require dynamic reasoning based on intermediate results, return {"mode": "reactive"}.
Otherwise return {"mode": "plan", "steps": [...]} where each step has: id (string), tool (tool name), params (object), and optionally capture, capture_path, on_found, on_empty.
Respond ONLY with valid JSON. No prose."""


async def build_plan(
    message: str,
    current_user: dict,
    client: anthropic.Anthropic,
) -> dict:
    """
    Ask claude-haiku-4-5 to produce a JSON execution plan for the given message.

    Returns a validated plan dict (mode="plan") or {"mode": "reactive"} on any
    failure: JSON parse error, unknown tool name, or explicit reactive signal.
    """
    catalog = get_tool_catalog()
    user_content = (
        f"User request: {message}\n\n"
        f"Available tools:\n{json.dumps(catalog, ensure_ascii=False)}\n\n"
        "Respond ONLY with valid JSON. No prose."
    )

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1024,
            system=[
                {
                    "type": "text",
                    "text": PLANNER_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": user_content}],
            betas=["prompt-caching-2024-07-31"],
        )
    except anthropic.APIError as e:
        logger.warning(f"[planner] API error, falling back to reactive: {e}")
        return {"mode": "reactive"}

    # Extract text from response
    text = "".join(
        block.text for block in response.content if hasattr(block, "text")
    ).strip()

    # Parse JSON — on failure fall back to reactive
    try:
        plan = json.loads(text)
    except json.JSONDecodeError as e:
        logger.warning(f"[planner] JSON parse failure, falling back to reactive: {e} | raw={text[:200]}")
        return {"mode": "reactive"}

    # If the model itself signals reactive, pass it through
    if plan.get("mode") == "reactive":
        logger.info("[planner] model returned reactive signal")
        return {"mode": "reactive"}

    # Validate: must have mode="plan" and steps list
    if plan.get("mode") != "plan" or not isinstance(plan.get("steps"), list):
        logger.warning(f"[planner] invalid plan structure, falling back to reactive: {plan}")
        return {"mode": "reactive"}

    # Validate all tool names against the registry
    known_names = {t["name"] for t in catalog}
    for step in plan["steps"]:
        tool_name = step.get("tool", "")
        if tool_name not in known_names:
            logger.error(
                f"[planner] unknown tool '{tool_name}' in plan, falling back to reactive"
            )
            return {"mode": "reactive"}

    logger.info(f"[planner] validated plan with {len(plan['steps'])} steps")
    return plan
