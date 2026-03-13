"""Team router — list company members."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.schemas.team import TeamMemberRead

router = APIRouter(prefix="/team", tags=["Team"])


@router.get("/", response_model=List[TeamMemberRead])
async def list_team_members(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List all users in the current user's company."""
    result = await db.execute(
        select(User)
        .where(User.company_id == current_user["company_id"])
        .order_by(User.role.asc(), User.full_name.asc())
    )
    return result.scalars().all()
