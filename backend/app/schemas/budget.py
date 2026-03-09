"""Budget schemas."""

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel


class BudgetItemCreate(BaseModel):
    description: str
    quantity: Decimal = 1
    unit_price: Decimal = 0
    sort_order: int = 0


class BudgetItemRead(BaseModel):
    id: uuid.UUID
    description: str
    quantity: Decimal
    unit_price: Decimal
    total: Decimal
    sort_order: int

    model_config = {"from_attributes": True}


class BudgetCreate(BaseModel):
    installation_id: uuid.UUID
    title: str
    description: Optional[str] = None
    tax_rate: Decimal = 21.00
    valid_until: Optional[date] = None
    notes: Optional[str] = None
    items: List[BudgetItemCreate] = []


class BudgetRead(BaseModel):
    id: uuid.UUID
    installation_id: uuid.UUID
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
    created_at: datetime

    model_config = {"from_attributes": True}
