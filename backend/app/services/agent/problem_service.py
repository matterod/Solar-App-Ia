"""
Problem & Solution domain tool for Sol AI.

Encapsulates the full lifecycle of registering a problem (and optionally
its solution) in a single atomic operation so that:
  - No duplicates are created across multiple turns.
  - The Problem.status is always set to 'resolved' when a solution is provided.
  - Business logic lives here, not inside the generic CRUD layer.
"""

import json
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.problem import Problem
from app.models.solution import Solution

logger = logging.getLogger(__name__)


# ── Tool schema ────────────────────────────────────────────────────────────────

ADD_PROBLEM_TOOL = {
    "name": "add_problem",
    "description": (
        "USAR SIEMPRE que el usuario quiera anotar, guardar, registrar o agregar un problema técnico, "
        "falla, error o incidente de campo. También usar cuando hay solución disponible. "
        "Esta tool es OBLIGATORIA para cualquier operación de escritura sobre problemas — "
        "NO respondas con confirmación de texto sin haberla llamado primero. "
        "Si también hay solución disponible, pasala en el mismo llamado — esto actualiza el "
        "estado del problema a 'resolved' automáticamente en un solo paso atómico."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "Título breve del problema (máx. 150 caracteres). Ej: 'Falla de inversor Huawei en sombra parcial'."
            },
            "description": {
                "type": "string",
                "description": "Descripción detallada del problema: síntomas, contexto, equipo afectado, etc."
            },
            "solution": {
                "type": "string",
                "description": (
                    "Descripción de la solución aplicada. "
                    "Si no hay solución todavía, omitir este campo — el problema quedará en estado 'open'."
                )
            },
            "tags": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Etiquetas opcionales para categorizar el problema. Ej: ['inversor', 'sma', 'actualización']."
            }
        },
        "required": ["title", "description"]
    }
}


# ── Handler ────────────────────────────────────────────────────────────────────

async def add_problem(tool_input: dict, db: AsyncSession, user: dict = None) -> str:
    """
    Atomically create a Problem and (optionally) its Solution.

    Steps:
      1. Search for an existing Problem with the same title in this company
         to avoid duplicates.
      2. Create the Problem if it doesn't exist.
      3. If a solution is provided:
         a. Create the Solution linked to the Problem.
         b. Set Problem.status = 'resolved'.
      4. Commit once — all or nothing.
    """
    title: str = tool_input.get("title", "").strip()
    description: str = tool_input.get("description", "").strip()
    solution_text: str = (tool_input.get("solution") or "").strip()
    tags: list = tool_input.get("tags") or []

    if not title:
        return json.dumps({"error": "El campo 'title' es requerido."}, ensure_ascii=False)
    if not description:
        return json.dumps({"error": "El campo 'description' es requerido."}, ensure_ascii=False)

    company_id = user["company_id"] if user else None
    if not company_id:
        return json.dumps({"error": "No se pudo determinar la empresa del usuario."}, ensure_ascii=False)

    try:
        # ── 1. Duplicate check ─────────────────────────────────────────────────
        existing_q = (
            select(Problem)
            .where(Problem.company_id == company_id)
            .where(Problem.title == title)
        )
        existing_result = await db.execute(existing_q)
        existing_problem = existing_result.scalar_one_or_none()

        if existing_problem:
            problem = existing_problem
            created_new = False
        else:
            # ── 2. Create Problem ──────────────────────────────────────────────
            problem = Problem(
                company_id=company_id,
                title=title,
                description=description,
                status="open",
                tags=tags,
            )
            db.add(problem)
            await db.flush()  # get problem.id without committing yet
            created_new = True

        # ── 3. Add Solution (if provided) ──────────────────────────────────────
        solution_created = False
        if solution_text:
            solution = Solution(
                problem_id=problem.id,
                description=solution_text,
            )
            db.add(solution)
            problem.status = "resolved"
            solution_created = True

        # ── 4. Single commit ───────────────────────────────────────────────────
        await db.commit()

        # Build response
        result: dict = {
            "success": True,
            "problem_id": str(problem.id),
            "problem_title": problem.title,
            "status": problem.status,
        }

        if created_new:
            result["message"] = "✅ Problema registrado en la base de conocimiento."
        else:
            result["message"] = "ℹ️ Ya existía un problema con ese título — se reutilizó."

        if solution_created:
            result["solution_added"] = True
            result["message"] += " ✅ Solución agregada y problema marcado como resuelto."
        else:
            result["solution_added"] = False
            result["message"] += " El problema quedó en estado 'abierto' (sin solución por ahora)."

        return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        await db.rollback()
        logger.error(f"Error in add_problem tool: {e}")
        return json.dumps({"error": f"Error al registrar el problema: {str(e)}"}, ensure_ascii=False)
