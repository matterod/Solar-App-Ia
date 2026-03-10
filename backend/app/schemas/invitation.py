from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID
from typing import Optional

class InvitationCreate(BaseModel):
    email: EmailStr
    role: str = Field(default="technician", description="Role: admin, manager, technician, client")

class InvitationRead(BaseModel):
    id: UUID
    company_id: UUID
    email: str
    role: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
