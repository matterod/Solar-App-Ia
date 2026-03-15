"""Costs router."""

from typing import List, Optional
import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.cost import Cost
from app.models.installation import Installation
from app.models.user import User
from app.schemas.cost import CostCreate, CostRead, CostUpdate

router = APIRouter(prefix="/costs", tags=["Costs"])


@router.get("/", response_model=List[CostRead])
async def list_costs(
    installation_id: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List costs for an installation."""
    # Verify installation belongs to the company
    inst_check = await db.execute(
        select(Installation).where(
            Installation.id == installation_id,
            Installation.company_id == current_user["company_id"]
        )
    )
    if not inst_check.scalar():
        raise HTTPException(status_code=404, detail="Installation not found")

    query = (
        select(Cost)
        .where(
            Cost.installation_id == installation_id,
            Cost.company_id == current_user["company_id"]
        )
        .order_by(Cost.cost_date.desc(), Cost.created_at.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=CostRead, status_code=201)
async def create_cost(
    data: CostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create a cost entry."""
    # Verify installation belongs to the company
    inst_check = await db.execute(
        select(Installation).where(
            Installation.id == data.installation_id,
            Installation.company_id == current_user["company_id"]
        )
    )
    if not inst_check.scalar():
        raise HTTPException(status_code=404, detail="Installation not found")

    cost_data = data.model_dump()
    if not cost_data.get("cost_date"):
        cost_data["cost_date"] = date.today()

    cost = Cost(
        **cost_data,
        company_id=current_user["company_id"],
        created_by=current_user["id"]
    )
    db.add(cost)
    await db.commit()
    await db.refresh(cost)
    return cost


@router.put("/{id}", response_model=CostRead)
async def update_cost(
    id: uuid.UUID,
    data: CostUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update a cost entry."""
    query = select(Cost).where(
        Cost.id == id,
        Cost.company_id == current_user["company_id"]
    )
    result = await db.execute(query)
    cost = result.scalar_one_or_none()
    
    if not cost:
        raise HTTPException(status_code=404, detail="Cost not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cost, key, value)

    await db.commit()
    await db.refresh(cost)
    return cost


@router.delete("/{id}", status_code=204)
async def delete_cost(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete a cost entry."""
    query = delete(Cost).where(
        Cost.id == id,
        Cost.company_id == current_user["company_id"]
    )
    result = await db.execute(query)
    # result.rowcount might not be available for async delete in some cases, 
    # but we can check if anything was deleted or just let it be.
    # For now, let's just commit.
    
    await db.commit()
    return None
