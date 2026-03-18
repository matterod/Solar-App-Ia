"""Product schemas."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class ProductCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    unit: str = "units"
    current_stock: Decimal = 0
    min_stock: Decimal = 0
    unit_cost: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None


class ProductRead(BaseModel):
    id: uuid.UUID
    name: str
    sku: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    unit: str
    current_stock: Decimal
    min_stock: Decimal
    unit_cost: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    min_stock: Optional[Decimal] = None
    unit_cost: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    is_active: Optional[bool] = None
