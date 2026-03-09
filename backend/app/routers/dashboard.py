"""Dashboard router — analytics and summary data."""

from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.client import Client
from app.models.installation import Installation
from app.models.maintenance import Maintenance
from app.models.pending_task import PendingTask
from app.models.product import Product
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get dashboard summary statistics."""

    # Total clients
    clients_count = await db.execute(select(func.count(Client.id)))
    total_clients = clients_count.scalar()

    # Installations by status
    installations_count = await db.execute(select(func.count(Installation.id)))
    total_installations = installations_count.scalar()

    active_installations = await db.execute(
        select(func.count(Installation.id)).where(Installation.status.in_(["in_progress", "completed"]))
    )
    active_count = active_installations.scalar()

    # Total system power
    total_power = await db.execute(select(func.sum(Installation.system_power_kw)))
    total_kw = total_power.scalar() or 0

    # Upcoming maintenance (next 30 days)
    upcoming_maintenance = await db.execute(
        select(func.count(Maintenance.id)).where(
            and_(
                Maintenance.scheduled_date >= date.today(),
                Maintenance.scheduled_date <= date.today() + timedelta(days=30),
                Maintenance.status == "scheduled",
            )
        )
    )
    maintenance_count = upcoming_maintenance.scalar()

    # Pending tasks
    pending_tasks = await db.execute(
        select(func.count(PendingTask.id)).where(PendingTask.status == "pending")
    )
    tasks_count = pending_tasks.scalar()

    # Low stock products
    low_stock = await db.execute(
        select(func.count(Product.id)).where(
            and_(Product.current_stock <= Product.min_stock, Product.is_active == True)
        )
    )
    low_stock_count = low_stock.scalar()

    return {
        "total_clients": total_clients,
        "total_installations": total_installations,
        "active_installations": active_count,
        "total_power_kw": float(total_kw),
        "upcoming_maintenance": maintenance_count,
        "pending_tasks": tasks_count,
        "low_stock_products": low_stock_count,
    }
