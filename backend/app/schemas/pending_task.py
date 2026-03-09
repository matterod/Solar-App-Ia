"""Pending Task schemas."""

import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class PendingTaskCreate(BaseModel):
    installation_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[date] = None
    assigned_to: Optional[uuid.UUID] = None


class PendingTaskRead(BaseModel):
    id: uuid.UUID
    installation_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    assigned_to: Optional[uuid.UUID] = None
    due_date: Optional[date] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PendingTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[date] = None
    assigned_to: Optional[uuid.UUID] = None
