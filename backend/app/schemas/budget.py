"""Budget schemas."""

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel


class BudgetItemCreate(BaseModel):
    product_id: Optional[uuid.UUID] = None
    description: str
    quantity: Decimal = Decimal("1")
    unit_price: Decimal = Decimal("0")
    sort_order: int = 0


class BudgetItemRead(BaseModel):
    id: uuid.UUID
    budget_id: uuid.UUID
    product_id: Optional[uuid.UUID] = None
    description: str
    quantity: Decimal
    unit_price: Decimal
    total: Decimal
    sort_order: int

    model_config = {"from_attributes": True}


class BudgetCreate(BaseModel):
    client_id: Optional[uuid.UUID] = None
    installation_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    tax_rate: Decimal = Decimal("21.00")
    valid_until: Optional[date] = None
    notes: Optional[str] = None
    items: List[BudgetItemCreate] = []


class BudgetUpdate(BaseModel):
    client_id: Optional[uuid.UUID] = None
    installation_id: Optional[uuid.UUID] = None
    title: Optional[str] = None
    description: Optional[str] = None
    tax_rate: Optional[Decimal] = None
    status: Optional[str] = None
    valid_until: Optional[date] = None
    notes: Optional[str] = None
    items: Optional[List[BudgetItemCreate]] = None


class BudgetRead(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    client_id: Optional[uuid.UUID] = None
    installation_id: Optional[uuid.UUID] = None
    budget_number: Optional[str] = None
    title: str
    description: Optional[str] = None
    subtotal: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    total: Decimal
    status: str
    valid_until: Optional[date] = None
    notes: Optional[str] = None
    items: List[BudgetItemRead] = []
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BudgetListRead(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    client_id: Optional[uuid.UUID] = None
    installation_id: Optional[uuid.UUID] = None
    budget_number: Optional[str] = None
    title: str
    subtotal: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    total: Decimal
    status: str
    valid_until: Optional[date] = None
    client_name: Optional[str] = None
    installation_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BudgetStatusUpdate(BaseModel):
    status: str
