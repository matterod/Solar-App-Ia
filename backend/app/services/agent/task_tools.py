"""
Sol agent tools for PendingTask management.

Exposes three tools:
  - create_task  — create a new pending task (recurring or deadline)
  - complete_task — mark a task as completed
  - list_tasks   — list tasks for the current company
"""

import json
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pending_task import PendingTask

logger = logging.getLogger(__name__)


# ── Tool schemas ────────────────────────────────────────────────────────────────

CREATE_TASK_TOOL = {
    "name": "create_task",
    "description": (
        "Crea una tarea pendiente para la empresa. "
        "Usá esta tool cuando el usuario quiera agregar, registrar o crear una tarea. "
        "Si la tarea es recurrente (ej. revisión mensual), pasá `is_recurring=True` y no incluyas `due_date`. "
        "Si la tarea tiene fecha límite, pasá `is_recurring=False` y proporcioná `due_date`. "
        "NUNCA confirmes que la tarea fue creada sin haber llamado esta tool primero."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "Título de la tarea (máx. 255 caracteres). Ej: 'Revisar paneles del cliente García'."
            },
            "description": {
                "type": "string",
                "description": "Descripción opcional con más detalles de la tarea."
            },
            "due_date": {
                "type": "string",
                "description": (
                    "Fecha límite en formato YYYY-MM-DD. "
                    "Solo para tareas NO recurrentes (`is_recurring=False`). "
                    "Se ignora si `is_recurring=True`."
                )
            },
            "is_recurring": {
                "type": "boolean",
                "description": (
                    "True si la tarea se repite periódicamente (sin fecha límite fija). "
                    "False si tiene una fecha límite concreta."
                )
            }
        },
        "required": ["title", "is_recurring"]
    }
}

COMPLETE_TASK_TOOL = {
    "name": "complete_task",
    "description": (
        "Marca una tarea como completada. "
        "Usá esta tool cuando el usuario indique que terminó o completó una tarea. "
        "La tarea dejará de recibir recordatorios automáticos. "
        "Necesitás el `task_id` de la tarea — si no lo sabés, primero usá `list_tasks` para encontrarlo."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "task_id": {
                "type": "string",
                "description": "ID UUID de la tarea a completar. Usá `list_tasks` si no lo tenés."
            }
        },
        "required": ["task_id"]
    }
}

LIST_TASKS_TOOL = {
    "name": "list_tasks",
    "description": (
        "Lista las tareas de la empresa. "
        "Usá esta tool cuando el usuario quiera ver, consultar o buscar tareas. "
        "Podés filtrar por estado: 'pending' (pendientes) o 'completed' (completadas). "
        "Sin filtro, devuelve todas las tareas."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "status": {
                "type": "string",
                "enum": ["pending", "completed"],
                "description": "Filtrar por estado. Omitir para obtener todas las tareas."
            }
        },
        "required": []
    }
}


# ── Handlers ────────────────────────────────────────────────────────────────────

async def handle_create_task(tool_input: dict, db: AsyncSession, user: dict = None) -> str:
    """
    Create a new PendingTask.

    Business rules:
    - is_recurring=True  → task_type='recurring', due_date ignored
    - is_recurring=False + due_date provided → task_type='deadline'
    - is_recurring=False + no due_date → error (deadline tasks require a date)
    """
    title: str = (tool_input.get("title") or "").strip()
    description: str = (tool_input.get("description") or "").strip() or None
    due_date_str: str = (tool_input.get("due_date") or "").strip() or None
    is_recurring: bool = bool(tool_input.get("is_recurring", False))

    logger.info(
        "handle_create_task called",
        extra={
            "tool": "create_task",
            "user_id": str(user.get("id")) if user else None,
            "company_id": str(user.get("company_id")) if user else None,
            "title": title[:80],
            "is_recurring": is_recurring,
            "due_date": due_date_str,
        }
    )

    if not title:
        return json.dumps({"error": "El campo 'title' es requerido."}, ensure_ascii=False)

    company_id = user["company_id"] if user else None
    if not company_id:
        return json.dumps({"error": "No se pudo determinar la empresa del usuario."}, ensure_ascii=False)

    # Determine task_type and validate
    if is_recurring:
        task_type = "recurring"
        due_date = None
    else:
        if not due_date_str:
            return json.dumps(
                {"error": "Las tareas no recurrentes requieren una fecha límite."},
                ensure_ascii=False
            )
        task_type = "deadline"
        try:
            from datetime import date
            due_date = date.fromisoformat(due_date_str)
        except ValueError:
            return json.dumps(
                {"error": f"Formato de fecha inválido: '{due_date_str}'. Usá YYYY-MM-DD."},
                ensure_ascii=False
            )

    try:
        created_by = user.get("id") if user else None

        task = PendingTask(
            company_id=company_id,
            title=title,
            description=description,
            due_date=due_date,
            is_recurring=is_recurring,
            task_type=task_type,
            status="pending",
            created_by=created_by,
        )
        db.add(task)
        await db.commit()
        await db.refresh(task)

        type_label = "recurrente" if is_recurring else f"con fecha límite {due_date_str}"
        result = {
            "success": True,
            "task_id": str(task.id),
            "message": f"✅ Tarea '{title}' creada ({type_label}).",
            "task_type": task_type,
            "is_recurring": is_recurring,
            "due_date": due_date_str if not is_recurring else None,
        }
        return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        await db.rollback()
        logger.error(
            "handle_create_task failed",
            extra={
                "tool": "create_task",
                "user_id": str(user.get("id")) if user else None,
                "error": str(e),
            },
            exc_info=True,
        )
        raise


async def handle_complete_task(tool_input: dict, db: AsyncSession, user: dict = None) -> str:
    """
    Mark a PendingTask as completed.

    Security: always scope the query to the user's company_id so cross-company
    task completion is impossible.
    """
    task_id_str: str = (tool_input.get("task_id") or "").strip()

    logger.info(
        "handle_complete_task called",
        extra={
            "tool": "complete_task",
            "user_id": str(user.get("id")) if user else None,
            "company_id": str(user.get("company_id")) if user else None,
            "task_id": task_id_str,
        }
    )

    if not task_id_str:
        return json.dumps({"error": "El campo 'task_id' es requerido."}, ensure_ascii=False)

    try:
        task_id = uuid.UUID(task_id_str)
    except (ValueError, AttributeError):
        return json.dumps(
            {"error": f"Formato de task_id inválido: '{task_id_str}'. Debe ser un UUID."},
            ensure_ascii=False
        )

    company_id = user["company_id"] if user else None
    if not company_id:
        return json.dumps({"error": "No se pudo determinar la empresa del usuario."}, ensure_ascii=False)

    try:
        result = await db.execute(
            select(PendingTask).where(
                PendingTask.id == task_id,
                PendingTask.company_id == company_id,
            )
        )
        task = result.scalar_one_or_none()

        if not task:
            return json.dumps(
                {"error": "❌ Tarea no encontrada."},
                ensure_ascii=False
            )

        task.status = "completed"
        task.completed_at = datetime.now(timezone.utc)
        await db.commit()

        return json.dumps(
            {
                "success": True,
                "task_id": str(task.id),
                "message": f"✅ Tarea '{task.title}' marcada como completada. No recibirás más recordatorios.",
            },
            ensure_ascii=False
        )

    except Exception as e:
        await db.rollback()
        logger.error(
            "handle_complete_task failed",
            extra={
                "tool": "complete_task",
                "user_id": str(user.get("id")) if user else None,
                "error": str(e),
            },
            exc_info=True,
        )
        raise


async def handle_list_tasks(tool_input: dict, db: AsyncSession, user: dict = None) -> str:
    """
    List PendingTasks for the current company, optionally filtered by status.
    """
    status_filter: str = (tool_input.get("status") or "").strip() or None

    logger.info(
        "handle_list_tasks called",
        extra={
            "tool": "list_tasks",
            "user_id": str(user.get("id")) if user else None,
            "company_id": str(user.get("company_id")) if user else None,
            "status_filter": status_filter,
        }
    )

    company_id = user["company_id"] if user else None
    if not company_id:
        return json.dumps({"error": "No se pudo determinar la empresa del usuario."}, ensure_ascii=False)

    try:
        query = select(PendingTask).where(PendingTask.company_id == company_id)
        if status_filter:
            query = query.where(PendingTask.status == status_filter)
        query = query.order_by(PendingTask.created_at.desc())

        result = await db.execute(query)
        tasks = result.scalars().all()

        status_label = status_filter or "todas"
        if not tasks:
            return json.dumps(
                {"message": f"No hay tareas {status_label}.", "tasks": []},
                ensure_ascii=False
            )

        task_list = []
        for t in tasks:
            entry = {
                "id": str(t.id),
                "title": t.title,
                "status": t.status,
                "is_recurring": t.is_recurring,
                "task_type": t.task_type,
                "due_date": t.due_date.isoformat() if t.due_date else None,
                "description": t.description,
            }
            task_list.append(entry)

        return json.dumps(
            {"total": len(task_list), "status_filter": status_filter, "tasks": task_list},
            ensure_ascii=False
        )

    except Exception as e:
        logger.error(
            "handle_list_tasks failed",
            extra={
                "tool": "list_tasks",
                "user_id": str(user.get("id")) if user else None,
                "error": str(e),
            },
            exc_info=True,
        )
        raise
