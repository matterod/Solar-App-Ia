from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

class UsageDetail(BaseModel):
    used: int
    limit: Optional[int]  # None = unlimited

class PlanUsage(BaseModel):
    plan: str
    ai_questions: UsageDetail
    clients: UsageDetail
    installations: UsageDetail
    team_members: UsageDetail

class CompanyAdmin(BaseModel):
    id: UUID
    name: str
    plan: str
    subscription_status: str
    user_count: int
    created_at: datetime
    
    model_config = {"from_attributes": True}
