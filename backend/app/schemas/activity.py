"""Activity schemas."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ActivityCreate(BaseModel):
    installation_id: uuid.UUID
    title: str
    description: Optional[str] = None
    activity_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None


class ActivityRead(BaseModel):
    id: uuid.UUID
    installation_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    activity_date: datetime
    duration_minutes: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}
