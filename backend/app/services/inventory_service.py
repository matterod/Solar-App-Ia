import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product
from app.models.stock_movement import StockMovement

async def update_stock(tool_input: dict, db: AsyncSession, user: dict = None) -> str:
    """Updates the stock of a product, creating a stock movement log."""
    product_id = tool_input["product_id"]
    movement_type = tool_input["movement_type"]
    quantity = float(tool_input["quantity"])
    
    query = select(Product).where(Product.id == product_id)
    if user:
        query = query.where(Product.company_id == user["company_id"])
    result = await db.execute(query)
    product = result.scalar_one_or_none()
    
    if not product:
        return json.dumps({"error": "Producto no encontrado"})
        
    movement = StockMovement(
        company_id=user["company_id"] if user else None,
        product_id=product_id,
        installation_id=tool_input.get("installation_id"),
        movement_type=movement_type,
        quantity=quantity,
        notes=tool_input.get("notes"),
        created_by=user["id"] if user else None,
    )
    db.add(movement)
    
    if movement_type == "incoming":
        product.current_stock += quantity
    elif movement_type == "outgoing":
        product.current_stock -= quantity
        
    await db.commit()
    return json.dumps({
        "success": True, 
        "message": f"Stock actualizado mediante un movimiento '{movement_type}'.", 
        "current_stock": product.current_stock
    }, ensure_ascii=False)


UPDATE_STOCK_TOOL = {
    "name": "update_stock",
    "description": "Actualizar explícitamente el stock de un producto (entrada o salida de inventario) asegurando el registro de movimientos de stock.",
    "input_schema": {
        "type": "object",
        "properties": {
            "product_id": {"type": "string", "description": "UUID del producto (requerido)"},
            "movement_type": {"type": "string", "enum": ["incoming", "outgoing"], "description": "Tipo de movimiento (requerido)"},
            "quantity": {"type": "number", "description": "Cantidad a mover (requerido)"},
            "installation_id": {"type": "string", "description": "Opcional: UUID de la instalación donde se consumió el inventario"},
            "notes": {"type": "string", "description": "Notas sobre el movimiento de stock"}
        },
        "required": ["product_id", "movement_type", "quantity"]
    },
}
