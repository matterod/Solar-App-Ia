"""Invitations router — manage team invitations."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.database import get_db
from app.auth import get_current_user, require_role
from app.models.user import User
from app.models.company import Company
from app.models.invitation import CompanyInvitation
from app.schemas.invitation import InvitationCreate, InvitationRead, InvitationReceivedRead

router = APIRouter(prefix="/invitations", tags=["Invitations"])


# ── Admin endpoints (manage invitations sent by this company) ──

@router.get("/", response_model=List[InvitationRead])
async def list_invitations(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "partner")),
):
    """List all invitations sent by this company."""
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
    current_user: dict = Depends(require_role("admin", "partner")),
):
    """Create a new invitation for a team member."""
    existing = await db.execute(
        select(CompanyInvitation)
        .where(
            CompanyInvitation.company_id == current_user["company_id"],
            CompanyInvitation.email == invite_data.email,
            CompanyInvitation.status == "pending",
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Ya existe una invitación pendiente para este email.")

    new_invite = CompanyInvitation(
        company_id=current_user["company_id"],
        email=invite_data.email,
        role=invite_data.role,
        status="pending",
    )
    db.add(new_invite)
    await db.commit()
    await db.refresh(new_invite)
    return new_invite


@router.delete("/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_invitation(
    invitation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("admin", "partner")),
):
    """Cancel (delete) a pending invitation."""
    result = await db.execute(
        select(CompanyInvitation)
        .where(
            CompanyInvitation.id == invitation_id,
            CompanyInvitation.company_id == current_user["company_id"],
        )
    )
    invite = result.scalars().first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitación no encontrada")

    await db.delete(invite)
    await db.commit()
    return None


# ── Recipient endpoints (invitations received by the current user) ──

@router.get("/received", response_model=List[InvitationReceivedRead])
async def list_received_invitations(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List pending invitations received by the current user's email."""
    result = await db.execute(
        select(CompanyInvitation)
        .options(selectinload(CompanyInvitation.company))
        .where(
            CompanyInvitation.email == current_user["email"],
            CompanyInvitation.status == "pending",
        )
        .order_by(CompanyInvitation.created_at.desc())
    )
    rows = result.scalars().all()
    # Build response including company name
    return [
        InvitationReceivedRead(
            id=inv.id,
            company_id=inv.company_id,
            company_name=inv.company.name if inv.company else "Empresa",
            email=inv.email,
            role=inv.role,
            status=inv.status,
            created_at=inv.created_at,
        )
        for inv in rows
    ]


@router.post("/{invitation_id}/accept")
async def accept_invitation(
    invitation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Accept a pending invitation — move user to the inviting company."""
    result = await db.execute(
        select(CompanyInvitation).where(
            CompanyInvitation.id == invitation_id,
            CompanyInvitation.email == current_user["email"],
            CompanyInvitation.status == "pending",
        )
    )
    invite = result.scalars().first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitación no encontrada o ya fue procesada.")

    # Fetch the actual User ORM object
    user_result = await db.execute(
        select(User).options(selectinload(User.company)).where(User.id == current_user["id"])
    )
    user = user_result.scalar_one()

    old_company_id = user.company_id

    # Move user to the new company
    user.company_id = invite.company_id
    user.role = invite.role
    invite.status = "accepted"

    await db.commit()

    # Clean up old demo company if it has no more users
    remaining = await db.execute(
        select(User).where(User.company_id == old_company_id)
    )
    if not remaining.scalars().first():
        old_company = await db.execute(
            select(Company).where(Company.id == old_company_id)
        )
        company_obj = old_company.scalar_one_or_none()
        if company_obj and company_obj.plan == "demo":
            await db.delete(company_obj)
            await db.commit()

    return {"detail": "Invitación aceptada. Ahora perteneces a la empresa."}


@router.post("/{invitation_id}/reject")
async def reject_invitation(
    invitation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Reject a pending invitation."""
    result = await db.execute(
        select(CompanyInvitation).where(
            CompanyInvitation.id == invitation_id,
            CompanyInvitation.email == current_user["email"],
            CompanyInvitation.status == "pending",
        )
    )
    invite = result.scalars().first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitación no encontrada.")

    invite.status = "expired"  # Mark as rejected/expired
    await db.commit()
    return {"detail": "Invitación rechazada."}
