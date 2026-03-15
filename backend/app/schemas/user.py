"""User schemas."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "installer"
    phone: Optional[str] = None


class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    company_id: uuid.UUID
    company_name: Optional[str] = None
    plan: Optional[str] = None
    is_superadmin: bool = False
    ai_questions_used: int = 0

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
