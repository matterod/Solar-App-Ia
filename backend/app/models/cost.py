from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey, func, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import DECIMAL
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

cost_type_enum = SQLEnum('food', 'materials', 'vehicle', 'lodging', 'other', name='cost_type', create_type=False)

class Cost(Base):
    __tablename__ = "costs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    installation_id = Column(UUID(as_uuid=True), ForeignKey("installations.id", ondelete="CASCADE"), nullable=False)
    cost_type = Column(cost_type_enum, nullable=False)
    description = Column(String)
    amount = Column(DECIMAL(12, 2), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    cost_date = Column(Date, nullable=False, server_default=func.current_date())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    installation = relationship("Installation", back_populates="costs")
