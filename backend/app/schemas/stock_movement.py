"""Stock Movement schemas."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class StockMovementCreate(BaseModel):
    product_id: uuid.UUID
    installation_id: Optional[uuid.UUID] = None
    movement_type: str  # "incoming" | "outgoing"
    quantity: Decimal
    notes: Optional[str] = None


class StockMovementRead(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    installation_id: Optional[uuid.UUID] = None
    movement_type: str
    quantity: Decimal
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
