from sqlalchemy import Column, String, Enum as SQLEnum, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

# Declarar los ENUMs apuntando a los que ya existen en la DB
subscription_plan_enum = SQLEnum('demo', 'pro', name='subscription_plan', create_type=False)
subscription_status_enum = SQLEnum('active', 'inactive', 'cancelled', name='subscription_status', create_type=False)

class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    plan = Column(subscription_plan_enum, nullable=False, default='demo')
    subscription_status = Column(subscription_status_enum, nullable=False, default='active')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    installations = relationship("Installation", back_populates="company", cascade="all, delete-orphan")
    clients = relationship("Client", back_populates="erp_company", cascade="all, delete-orphan")
    problems = relationship("Problem", back_populates="company", cascade="all, delete-orphan")