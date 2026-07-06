"""Pending Tasks router."""

from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.pending_task import PendingTask
from app.models.user import User
from app.schemas.pending_task import PendingTaskCreate, PendingTaskRead, PendingTaskUpdate
from app.models.installation import Installation

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("/", response_model=List[PendingTaskRead])
async def list_tasks(
    status: str = None,
    priority: str = None,
    installation_id: uuid.UUID = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List pending tasks with filters."""
    query = (
        select(PendingTask)
        .join(Installation, PendingTask.installation_id == Installation.id)
        .where(
            Installation.company_id == current_user["company_id"]
        )
    )
    if status:
        query = query.where(PendingTask.status == status)
    if priority:
        query = query.where(PendingTask.priority == priority)
    if installation_id:
        query = query.where(PendingTask.installation_id == installation_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=PendingTaskRead, status_code=201)
async def create_task(
    data: PendingTaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new pending task."""
    task = PendingTask(**data.model_dump(), created_by=current_user["id"])
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task


@router.put("/{task_id}", response_model=PendingTaskRead)
async def update_task(
    task_id: uuid.UUID,
    data: PendingTaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a pending task."""
    result = await db.execute(
        select(PendingTask)
        .join(Installation, PendingTask.installation_id == Installation.id)
        .where(
            PendingTask.id == task_id,
            Installation.company_id == current_user["company_id"]
        )
    )

    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    await db.flush()
    await db.refresh(task)
    return task
