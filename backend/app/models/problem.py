from sqlalchemy import Column, ForeignKey, String, Text, DateTime, Enum, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid

from app.database import Base

class Problem(Base):
    __tablename__ = "problem"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum('open', 'resolved', 'ignored', name='problem_status'), default='open', nullable=False)
    tags = Column(ARRAY(String), default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    company = relationship("Company", back_populates="problems")
    solutions = relationship("Solution", back_populates="problem", cascade="all, delete-orphan")
