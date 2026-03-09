"""Activities router."""

from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.activity import Activity
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityRead

router = APIRouter(prefix="/activities", tags=["Activities"])


@router.get("/", response_model=List[ActivityRead])
async def list_activities(
    installation_id: uuid.UUID = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List activities, optionally filtered by installation."""
    query = select(Activity).offset(skip).limit(limit).order_by(Activity.activity_date.desc())
    if installation_id:
        query = query.where(Activity.installation_id == installation_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=ActivityRead, status_code=201)
async def create_activity(
    data: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create an activity log entry."""
    activity = Activity(**data.model_dump(), user_id=current_user.id)
    db.add(activity)
    await db.flush()
    await db.refresh(activity)
    return activity
