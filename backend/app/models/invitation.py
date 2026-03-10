import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.models.user import user_role_enum

invitation_status_enum = SQLEnum('pending', 'accepted', 'expired', name='invitation_status', create_type=False)

class CompanyInvitation(Base):
    __tablename__ = "company_invitations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(255), nullable=False)
    role = Column(user_role_enum, default="technician", nullable=False)
    status = Column(invitation_status_enum, default="pending", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    # Note: expires_at relies on DB-level default if omitted, but we will set it explicitly usually or use postgres interval. 
    # Let's just track created_at for simple status.
    
    company = relationship("Company", backref="invitations")
