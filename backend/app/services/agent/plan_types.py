"""
Type definitions for the Plan-and-Execute agent pipeline.

PlanStep  — a single step in an execution plan
Plan      — a full plan (mode="plan") with ordered steps
StepResult — the recorded outcome of executing one step
"""

from typing import Optional, TypedDict


class PlanStep(TypedDict):
    id: str
    tool: str
    params: dict
    capture: Optional[str]         # variable name to store result into
    capture_path: Optional[str]    # dotted path e.g. "records.0.id" or "id"
    on_found: Optional[str]        # step id to skip if result has records
    on_empty: Optional[str]        # "continue" or "stop"


class Plan(TypedDict):
    mode: str                      # "plan" or "reactive"
    steps: list[PlanStep]


class StepResult(TypedDict):
    step_id: str
    tool: str
    params: dict
    result: str                    # raw JSON string from execute_tool
    skipped: bool
    error: Optional[bool]
