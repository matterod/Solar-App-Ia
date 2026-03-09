"""Installation schemas."""

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.activity import ActivityRead
from app.schemas.maintenance import MaintenanceRead


class InstallationCreate(BaseModel):
    client_id: uuid.UUID
    location_name: str
    address: str
    city: Optional[str] = None
    province: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    panel_count: int = 0
    panel_model: Optional[str] = None
    inverter_model: Optional[str] = None
    inverter_count: int = 1
    system_power_kw: Optional[Decimal] = None
    installation_date: Optional[date] = None
    status: str = "pending"
    description: Optional[str] = None


class InstallationRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    location_name: str
    address: str
    city: Optional[str] = None
    province: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    panel_count: int
    panel_model: Optional[str] = None
    inverter_model: Optional[str] = None
    inverter_count: int
    system_power_kw: Optional[Decimal] = None
    installation_date: Optional[date] = None
    status: str
    description: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class InstallationUpdate(BaseModel):
    location_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    panel_count: Optional[int] = None
    panel_model: Optional[str] = None
    inverter_model: Optional[str] = None
    inverter_count: Optional[int] = None
    system_power_kw: Optional[Decimal] = None
    installation_date: Optional[date] = None
    status: Optional[str] = None
    description: Optional[str] = None


class InstallationDetail(InstallationRead):
    """Extended installation with nested related data."""
    activities: List[ActivityRead] = []
    maintenance_records: List[MaintenanceRead] = []

    model_config = {"from_attributes": True}
