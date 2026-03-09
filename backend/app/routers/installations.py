"""Installations router — CRUD with related data."""

from typing import List
import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.installation import Installation
from app.models.maintenance import Maintenance
from app.models.user import User
from app.schemas.installation import InstallationCreate, InstallationRead, InstallationUpdate, InstallationDetail

router = APIRouter(prefix="/installations", tags=["Installations"])


@router.get("/", response_model=List[InstallationRead])
async def list_installations(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    search: str = None,
    client_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List installations with filters."""
    query = select(Installation).offset(skip).limit(limit).order_by(Installation.created_at.desc())
    if status:
        query = query.where(Installation.status == status)
    if search:
        query = query.where(Installation.location_name.ilike(f"%{search}%"))
    if client_id:
        query = query.where(Installation.client_id == client_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{installation_id}", response_model=InstallationDetail)
async def get_installation(
    installation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get installation with all related data."""
    query = (
        select(Installation)
        .options(
            selectinload(Installation.activities),
            selectinload(Installation.maintenance_records),
        )
        .where(Installation.id == installation_id)
    )
    result = await db.execute(query)
    installation = result.scalar_one_or_none()
    if not installation:
        raise HTTPException(status_code=404, detail="Installation not found")
    return installation


@router.post("/", response_model=InstallationRead, status_code=201)
async def create_installation(
    data: InstallationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new installation and auto-schedule first maintenance."""
    installation = Installation(**data.model_dump(), created_by=current_user.id)
    db.add(installation)
    await db.flush()
    await db.refresh(installation)

    # Auto-schedule maintenance at installation_date + 6 months
    if installation.installation_date:
        maintenance_date = installation.installation_date + timedelta(days=180)
        maintenance = Maintenance(
            installation_id=installation.id,
            scheduled_date=maintenance_date,
            maintenance_type="routine",
            description="Mantenimiento preventivo programado automáticamente (6 meses post-instalación)",
        )
        db.add(maintenance)
        await db.flush()

    return installation


@router.put("/{installation_id}", response_model=InstallationRead)
async def update_installation(
    installation_id: uuid.UUID,
    data: InstallationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an installation."""
    result = await db.execute(select(Installation).where(Installation.id == installation_id))
    installation = result.scalar_one_or_none()
    if not installation:
        raise HTTPException(status_code=404, detail="Installation not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(installation, field, value)

    await db.flush()
    await db.refresh(installation)
    return installation


@router.delete("/{installation_id}", status_code=204)
async def delete_installation(
    installation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an installation."""
    result = await db.execute(select(Installation).where(Installation.id == installation_id))
    installation = result.scalar_one_or_none()
    if not installation:
        raise HTTPException(status_code=404, detail="Installation not found")
    await db.delete(installation)
