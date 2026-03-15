from sqlalchemy import Column, String, Boolean, DateTime, func, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

user_role_enum = SQLEnum('admin', 'partner', 'installer', 'accountant', name='user_role', create_type=False)

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    firebase_uid = Column(String(128), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(user_role_enum, default="installer", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superadmin = Column(Boolean, default=False, nullable=False)
    phone = Column(String(50))
    avatar_url = Column(String)
    message_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    company = relationship("Company", back_populates="users")
    installations = relationship("Installation", back_populates="assigned_installer", foreign_keys="[Installation.assigned_to]")
    created_installations = relationship("Installation", back_populates="creator", foreign_keys="[Installation.created_by]")
