"""Payment schemas."""

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class PaymentCreate(BaseModel):
    installation_id: uuid.UUID
    budget_id: Optional[uuid.UUID] = None
    amount: Decimal
    payment_date: date
    payment_method: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentRead(BaseModel):
    id: uuid.UUID
    installation_id: uuid.UUID
    budget_id: Optional[uuid.UUID] = None
    amount: Decimal
    payment_date: date
    payment_method: Optional[str] = None
    reference: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
