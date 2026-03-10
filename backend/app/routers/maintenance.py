"""Maintenance router."""

from typing import List
import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.maintenance import Maintenance
from app.models.installation import Installation
from app.models.user import User
from app.schemas.maintenance import MaintenanceCreate, MaintenanceRead, MaintenanceUpdate

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


@router.get("/", response_model=List[MaintenanceRead])
async def list_maintenance(
    installation_id: uuid.UUID = None,
    status: str = None,
    upcoming_days: int = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List maintenance records with filters."""
    query = (
        select(Maintenance)
        .join(Installation, Maintenance.installation_id == Installation.id)
        .where(Installation.company_id == current_user["company_id"])
        .offset(skip)
        .limit(limit)
        .order_by(Maintenance.scheduled_date)
    )
    if installation_id:
        query = query.where(Maintenance.installation_id == installation_id)
    if status:
        query = query.where(Maintenance.status == status)
    if upcoming_days:
        end_date = date.today() + timedelta(days=upcoming_days)
        query = query.where(
            and_(
                Maintenance.scheduled_date >= date.today(),
                Maintenance.scheduled_date <= end_date,
                Maintenance.status == "scheduled",
            )
        )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=MaintenanceRead, status_code=201)
async def create_maintenance(
    data: MaintenanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Schedule a maintenance event."""
    maintenance = Maintenance(**data.model_dump())
    db.add(maintenance)
    await db.flush()
    await db.refresh(maintenance)
    return maintenance


@router.put("/{maintenance_id}", response_model=MaintenanceRead)
async def update_maintenance(
    maintenance_id: uuid.UUID,
    data: MaintenanceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a maintenance record."""
    result = await db.execute(
        select(Maintenance)
        .join(Installation, Maintenance.installation_id == Installation.id)
        .where(
            Maintenance.id == maintenance_id,
            Installation.company_id == current_user["company_id"]
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(record, field, value)

    await db.flush()
    await db.refresh(record)
    return record
