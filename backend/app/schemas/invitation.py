from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID
from typing import Optional


class InvitationCreate(BaseModel):
    email: EmailStr
    role: str = Field(default="installer", description="Role: admin, partner, installer, accountant")


class InvitationRead(BaseModel):
    id: UUID
    company_id: UUID
    email: str
    role: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class InvitationReceivedRead(BaseModel):
    """Schema for invitations as seen by the recipient — includes company name."""
    id: UUID
    company_id: UUID
    company_name: str
    email: str
    role: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
