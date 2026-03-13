"""Installation model."""

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Installation(Base):
    __tablename__ = "installations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    location_name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str | None] = mapped_column(String(100))
    province: Mapped[str | None] = mapped_column(String(100))
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 8))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(11, 8))
    panel_count: Mapped[int] = mapped_column(Integer, default=0)
    panel_model: Mapped[str | None] = mapped_column(String(255))
    inverter_model: Mapped[str | None] = mapped_column(String(255))
    inverter_count: Mapped[int] = mapped_column(Integer, default=1)
    system_power_kw: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    installation_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(
        Enum("pending", "in_progress", "completed", "maintenance", "inactive", name="installation_status", create_type=False),
        nullable=False, default="pending"
    )
    description: Mapped[str | None] = mapped_column(Text)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="installations")
    client = relationship("Client", back_populates="installations")
    activities = relationship("Activity", back_populates="installation", cascade="all, delete-orphan")
    photos = relationship("Photo", back_populates="installation", cascade="all, delete-orphan")
    pending_tasks = relationship("PendingTask", back_populates="installation")
    budgets = relationship("Budget", back_populates="installation", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="installation", cascade="all, delete-orphan")
    maintenance_records = relationship("Maintenance", back_populates="installation", cascade="all, delete-orphan")
    
    assigned_installer = relationship("User", back_populates="installations", foreign_keys="[Installation.assigned_to]")
    creator = relationship("User", back_populates="created_installations", foreign_keys="[Installation.created_by]")
