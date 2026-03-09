"""Maintenance schemas."""

import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class MaintenanceCreate(BaseModel):
    installation_id: uuid.UUID
    scheduled_date: date
    maintenance_type: str = "routine"
    description: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None


class MaintenanceRead(BaseModel):
    id: uuid.UUID
    installation_id: uuid.UUID
    scheduled_date: date
    completed_date: Optional[date] = None
    status: str
    maintenance_type: str
    description: Optional[str] = None
    findings: Optional[str] = None
    notification_sent: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MaintenanceUpdate(BaseModel):
    scheduled_date: Optional[date] = None
    completed_date: Optional[date] = None
    status: Optional[str] = None
    maintenance_type: Optional[str] = None
    description: Optional[str] = None
    findings: Optional[str] = None
