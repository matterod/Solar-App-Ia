import json
from datetime import date, timedelta, datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.maintenance import Maintenance

async def schedule_maintenance(tool_input: dict, db: AsyncSession) -> str:
    """Schedules a maintenance task for an installation."""
    # Convert string date if necessary
    sched_date = tool_input["scheduled_date"]
    if isinstance(sched_date, str):
        sched_date = datetime.strptime(sched_date.split("T")[0], "%Y-%m-%d").date()
        
    new_maint = Maintenance(
        installation_id=tool_input["installation_id"],
        scheduled_date=sched_date, 
        maintenance_type=tool_input.get("maintenance_type", "routine"),
        description=tool_input.get("description")
    )
    db.add(new_maint)
    await db.commit()
    await db.refresh(new_maint)
    return json.dumps({
        "success": True, 
        "message": "Mantenimiento programado con éxito.", 
        "maintenance_id": str(new_maint.id)
    }, ensure_ascii=False)


async def get_upcoming_maintenance(tool_input: dict, db: AsyncSession) -> str:
    """Gets a list of upcoming scheduled maintenance."""
    cutoff = date.today() + timedelta(days=tool_input.get("days", 30))
    query = select(Maintenance).where(Maintenance.scheduled_date <= cutoff).where(Maintenance.status == "scheduled").order_by(Maintenance.scheduled_date).limit(10)
    result = await db.execute(query)
    data = [
        {"id": str(m.id), "installation_id": str(m.installation_id), "scheduled_date": str(m.scheduled_date), "maintenance_type": m.maintenance_type}
        for m in result.scalars().all()
    ]
    return json.dumps({"maintenance": data, "count": len(data)}, ensure_ascii=False)


SCHEDULE_MAINTENANCE_TOOL = {
    "name": "schedule_maintenance",
    "description": "Herramienta especializada para programar un evento de mantenimiento para una instalación.",
    "input_schema": {
        "type": "object",
        "properties": {
            "installation_id": {"type": "string", "description": "UUID de la instalación (requerido)"},
            "scheduled_date": {"type": "string", "description": "Fecha del mantenimiento YYYY-MM-DD (requerido)"},
            "maintenance_type": {"type": "string", "enum": ["routine", "preventive", "corrective"], "description": "Tipo de mantenimiento"},
            "description": {"type": "string", "description": "Descripción del mantenimiento a realizar"},
        },
        "required": ["installation_id", "scheduled_date"]
    },
}

GET_UPCOMING_MAINTENANCE_TOOL = {
    "name": "get_upcoming_maintenance",
    "description": "Obtener mantenimientos programados próximos en el calendario de operaciones.",
    "input_schema": {
        "type": "object",
        "properties": {
            "days": {"type": "integer", "description": "Días hacia adelante (default 30)"},
        },
    },
}
