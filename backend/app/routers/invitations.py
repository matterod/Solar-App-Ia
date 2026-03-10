from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.database import get_db
from app.auth import get_current_user, require_role
from app.models.user import User
from app.models.invitation import CompanyInvitation
from app.schemas.invitation import InvitationCreate, InvitationRead

router = APIRouter(prefix="/invitations", tags=["Invitations"])

@router.get("/", response_model=List[InvitationRead])
async def list_invitations(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "manager")),
):
    """List all invitations for the company."""
    result = await db.execute(
        select(CompanyInvitation)
        .where(CompanyInvitation.company_id == current_user["company_id"])
        .order_by(CompanyInvitation.created_at.desc())
    )
    return result.scalars().all()

@router.post("/", response_model=InvitationRead, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    invite_data: InvitationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "manager")),
):
    """Create a new invitation for a team member."""
    # Check if a pending invite already exists for this email in this company
    existing = await db.execute(
        select(CompanyInvitation)
        .where(
            CompanyInvitation.company_id == current_user["company_id"],
            CompanyInvitation.email == invite_data.email,
        )
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="An invitation for this email already exists."
        )

    new_invite = CompanyInvitation(
        company_id=current_user["company_id"],
        email=invite_data.email,
        role=invite_data.role,
        status="pending"
    )
    db.add(new_invite)
    await db.commit()
    await db.refresh(new_invite)
    return new_invite

@router.delete("/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_invitation(
    invitation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "manager")),
):
    """Cancel (delete) a pending invitation."""
    result = await db.execute(
        select(CompanyInvitation)
        .where(
            CompanyInvitation.id == invitation_id,
            CompanyInvitation.company_id == current_user["company_id"]
        )
    )
    invite = result.scalars().first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    await db.delete(invite)
    await db.commit()
    return None
