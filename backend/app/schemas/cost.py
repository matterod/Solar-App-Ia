from pydantic import BaseModel
from datetime import date, datetime
from uuid import UUID
from typing import Optional
from decimal import Decimal

class CostCreate(BaseModel):
    installation_id: UUID
    cost_type: str  # 'food', 'materials', 'vehicle', 'lodging', 'other'
    description: Optional[str] = None
    amount: Decimal
    quantity: int = 1
    cost_date: Optional[date] = None  # defaults to today in the router

class CostRead(BaseModel):
    id: UUID
    company_id: UUID
    installation_id: UUID
    cost_type: str
    description: Optional[str]
    amount: Decimal
    quantity: int
    cost_date: date
    created_by: Optional[UUID]
    created_at: datetime

    model_config = {"from_attributes": True}

class CostUpdate(BaseModel):
    cost_type: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    quantity: Optional[int] = None
    cost_date: Optional[date] = None
