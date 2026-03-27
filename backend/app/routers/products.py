"""Products router — inventory management."""

from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_, asc, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/", response_model=List[ProductRead])
async def list_products(
    category: str = None,
    search: str = None,
    low_stock: bool = False,
    sort: str = "name",
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List products with filters."""
    sort_map = {
        "name": asc(Product.name),
        "price_asc": asc(Product.unit_cost),
        "price_desc": desc(Product.unit_cost),
    }
    order = sort_map.get(sort, asc(Product.name))

    query = (
        select(Product)
        .where(Product.company_id == current_user["company_id"])
        .where(Product.is_active == True)
        .order_by(order)
        .offset(skip)
        .limit(limit)
    )
    if category:
        query = query.where(Product.category == category)
    if search:
        query = query.where(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%"),
            )
        )
    if low_stock:
        query = query.where(Product.current_stock <= Product.min_stock)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=ProductRead, status_code=201)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new product."""
    product = Product(company_id=current_user["company_id"], **data.model_dump())
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a product."""
    result = await db.execute(select(Product).where(Product.company_id == current_user["company_id"]).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    await db.flush()
    await db.refresh(product)
    return product
