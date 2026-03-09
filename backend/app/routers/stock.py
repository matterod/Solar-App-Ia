"""Stock movements router."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.user import User
from app.schemas.stock_movement import StockMovementCreate, StockMovementRead

router = APIRouter(prefix="/stock", tags=["Stock"])


@router.get("/movements", response_model=List[StockMovementRead])
async def list_movements(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List stock movements."""
    query = select(StockMovement).offset(skip).limit(limit).order_by(StockMovement.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/movements", response_model=StockMovementRead, status_code=201)
async def create_movement(
    data: StockMovementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a stock movement and update product stock."""
    # Validate product exists
    result = await db.execute(select(Product).where(Product.id == data.product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Update stock
    if data.movement_type == "incoming":
        product.current_stock += data.quantity
    elif data.movement_type == "outgoing":
        if product.current_stock < data.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        product.current_stock -= data.quantity
    else:
        raise HTTPException(status_code=400, detail="Invalid movement type")

    movement = StockMovement(**data.model_dump(), created_by=current_user.id)
    db.add(movement)
    await db.flush()
    await db.refresh(movement)
    return movement
