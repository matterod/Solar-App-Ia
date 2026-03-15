import json
from datetime import date
from typing import Any, Dict, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.cost import Cost
from app.models.installation import Installation

ADD_COST_TOOL = {
    "name": "add_installation_cost",
    "description": "Registra un gasto o costo asociado a una instalación. Busca la instalación por nombre.",
    "input_schema": {
        "type": "object",
        "properties": {
            "installation_name": {"type": "string", "description": "Nombre de la instalación (búsqueda parcial)"},
            "cost_type": {"type": "string", "enum": ["food", "materials", "vehicle", "lodging", "other"],
                          "description": "Tipo de gasto: food (comida), materials (materiales), vehicle (vehículo), lodging (alojamiento), other (otro)"},
            "amount": {"type": "number", "description": "Monto del gasto en pesos"},
            "description": {"type": "string", "description": "Descripción del gasto"},
            "quantity": {"type": "integer", "description": "Cantidad (default 1)"},
            "cost_date": {"type": "string", "description": "Fecha del gasto en formato YYYY-MM-DD (default hoy)"}
        },
        "required": ["installation_name", "cost_type", "amount"]
    }
}

async def add_installation_cost(
    tool_input: Dict[str, Any],
    db: AsyncSession,
    user: Any
) -> str:
    """Tool handler to add a cost to an installation by name search."""
    
    installation_name = tool_input.get("installation_name")
    cost_type = tool_input.get("cost_type")
    amount = tool_input.get("amount")
    description = tool_input.get("description")
    quantity = tool_input.get("quantity", 1)
    cost_date = tool_input.get("cost_date")

    # 1. Find installation by name (ILIKE search) within company
    query = select(Installation).where(
        Installation.company_id == user["company_id"],
        Installation.location_name.ilike(f"%{installation_name}%")
    )
    result = await db.execute(query)
    installations = result.scalars().all()
    
    if not installations:
        return json.dumps({"error": f"No se encontró ninguna instalación con el nombre '{installation_name}'."}, ensure_ascii=False)
    
    if len(installations) > 1:
        names = ", ".join([i.location_name for i in installations])
        return json.dumps({"error": f"Se encontraron múltiples instalaciones: {names}. Por favor sé más específico."}, ensure_ascii=False)
    
    installation = installations[0]
    
    # 2. Parse date
    try:
        final_date = date.fromisoformat(cost_date) if cost_date else date.today()
    except ValueError:
        return json.dumps({"error": "Formato de fecha inválido. Usar YYYY-MM-DD."}, ensure_ascii=False)

    # 3. Create cost
    cost = Cost(
        company_id=user["company_id"],
        installation_id=installation.id,
        cost_type=cost_type,
        amount=amount,
        quantity=quantity,
        description=description,
        cost_date=final_date,
        created_by=user["id"]
    )
    
    try:
        db.add(cost)
        await db.commit()
        await db.refresh(cost)
        
        total = amount * quantity
        
        return json.dumps({
            "success": True,
            "message": f"Gasto de ${total:,.2f} registrado en '{installation.location_name}' ({cost_type}).",
            "cost_id": str(cost.id),
            "total": total
        }, ensure_ascii=False)
    except Exception as e:
        await db.rollback()
        return json.dumps({"error": f"Error al guardar el gasto: {str(e)}"}, ensure_ascii=False)
