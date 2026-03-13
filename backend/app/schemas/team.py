"""Team schemas."""

import uuid
from pydantic import BaseModel


class TeamMemberRead(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}
