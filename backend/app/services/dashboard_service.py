import json
from datetime import date, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client
from app.models.installation import Installation
from app.models.product import Product

async def get_dashboard_stats(tool_input: dict, db: AsyncSession) -> str:
    """Gets business statistics."""
    clients = await db.execute(select(func.count(Client.id)))
    installations = await db.execute(select(func.count(Installation.id)))
    active = await db.execute(select(func.count(Installation.id)).where(Installation.status.in_(["completed", "maintenance"])))
    power = await db.execute(select(func.coalesce(func.sum(Installation.system_power_kw), 0)))
    stats = {
        "total_clients": clients.scalar() or 0,
        "total_installations": installations.scalar() or 0,
        "active_installations": active.scalar() or 0,
        "total_power_kw": float(power.scalar() or 0),
    }
    return json.dumps(stats, ensure_ascii=False)


GET_DASHBOARD_STATS_TOOL = {
    "name": "get_dashboard_stats",
    "description": "Obtener estadísticas generales y KPIs del negocio (clientes totales, instalaciones, potencia).",
    "input_schema": {"type": "object", "properties": {}},
}
