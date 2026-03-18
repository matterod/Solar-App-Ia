"""Budget agent tool — allows Sol to create quotes via natural language."""

import json
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.budget import Budget, BudgetItem
from app.models.client import Client
from app.models.installation import Installation
from app.models.product import Product


CREATE_BUDGET_TOOL = {
    "name": "create_budget",
    "description": (
        "Crea un presupuesto/cotización para un cliente. "
        "Busca productos del inventario por nombre y arma el presupuesto "
        "automáticamente con los precios del catálogo (sale_price o unit_cost)."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "client_name": {
                "type": "string",
                "description": "Nombre (o parte del nombre) del cliente",
            },
            "title": {
                "type": "string",
                "description": "Título del presupuesto (ej: 'Instalación Solar 5kW')",
            },
            "items": {
                "type": "array",
                "description": "Lista de ítems del presupuesto",
                "items": {
                    "type": "object",
                    "properties": {
                        "product_name": {
                            "type": "string",
                            "description": "Nombre del producto a buscar en inventario",
                        },
                        "quantity": {
                            "type": "number",
                            "description": "Cantidad",
                        },
                        "custom_price": {
                            "type": "number",
                            "description": "Precio personalizado (opcional, usa el del catálogo si no se indica)",
                        },
                    },
                    "required": ["product_name", "quantity"],
                },
            },
            "tax_rate": {
                "type": "number",
                "description": "Tasa de IVA en %. Default: 21",
            },
            "notes": {
                "type": "string",
                "description": "Notas o condiciones del presupuesto",
            },
            "installation_name": {
                "type": "string",
                "description": "Nombre de la instalación asociada (opcional)",
            },
        },
        "required": ["client_name", "title", "items"],
    },
}


async def _generate_budget_number(db: AsyncSession, company_id: uuid.UUID) -> str:
    """Generate sequential budget number."""
    year = datetime.now().year
    prefix = f"PRES-{year}-"
    result = await db.execute(
        select(func.count(Budget.id)).where(
            Budget.company_id == company_id,
            Budget.budget_number.like(f"{prefix}%"),
        )
    )
    count = result.scalar() or 0
    return f"{prefix}{count + 1:03d}"


async def create_budget(
    tool_input: Dict[str, Any],
    db: AsyncSession,
    user: Any,
) -> str:
    """Tool handler: create a budget from product inventory."""
    company_id = user["company_id"]
    client_name = tool_input.get("client_name")
    title = tool_input.get("title")
    items_input = tool_input.get("items", [])
    tax_rate = Decimal(str(tool_input.get("tax_rate", 21)))
    notes = tool_input.get("notes")
    installation_name = tool_input.get("installation_name")

    # 1. Find client by name
    result = await db.execute(
        select(Client).where(
            Client.company_id == company_id,
            Client.name.ilike(f"%{client_name}%"),
        )
    )
    clients = result.scalars().all()

    if not clients:
        return json.dumps(
            {"error": f"No se encontró ningún cliente con el nombre '{client_name}'."},
            ensure_ascii=False,
        )

    if len(clients) > 1:
        names = ", ".join([c.name for c in clients])
        return json.dumps(
            {"error": f"Se encontraron múltiples clientes: {names}. Sé más específico."},
            ensure_ascii=False,
        )

    client = clients[0]

    # 2. Find installation (optional)
    installation_id = None
    if installation_name:
        result = await db.execute(
            select(Installation).where(
                Installation.company_id == company_id,
                Installation.location_name.ilike(f"%{installation_name}%"),
            )
        )
        installations = result.scalars().all()

        if len(installations) == 1:
            installation_id = installations[0].id
        elif len(installations) > 1:
            names = ", ".join([i.location_name for i in installations])
            return json.dumps(
                {"error": f"Se encontraron múltiples instalaciones: {names}. Sé más específico."},
                ensure_ascii=False,
            )

    # 3. Resolve products and build items
    budget_items = []
    subtotal = Decimal("0")
    items_summary = []

    for i, item_input in enumerate(items_input):
        product_name = item_input.get("product_name")
        quantity = Decimal(str(item_input.get("quantity", 1)))
        custom_price = item_input.get("custom_price")

        # Search product
        result = await db.execute(
            select(Product).where(
                Product.company_id == company_id,
                Product.is_active == True,
                Product.name.ilike(f"%{product_name}%"),
            )
        )
        products = result.scalars().all()

        if not products:
            return json.dumps(
                {"error": f"No se encontró el producto '{product_name}' en inventario."},
                ensure_ascii=False,
            )

        if len(products) > 1:
            names = ", ".join([p.name for p in products])
            return json.dumps(
                {"error": f"Múltiples productos coinciden con '{product_name}': {names}. Sé más específico."},
                ensure_ascii=False,
            )

        product = products[0]

        # Determine price
        if custom_price is not None:
            unit_price = Decimal(str(custom_price))
        elif product.sale_price:
            unit_price = product.sale_price
        elif product.unit_cost:
            unit_price = product.unit_cost
        else:
            unit_price = Decimal("0")

        item_total = quantity * unit_price
        subtotal += item_total

        budget_items.append({
            "product_id": product.id,
            "description": product.name,
            "quantity": quantity,
            "unit_price": unit_price,
            "total": item_total,
            "sort_order": i,
        })

        items_summary.append(
            f"  {int(quantity)}x {product.name} — ${float(item_total):,.2f}"
        )

    # 4. Calculate totals
    tax_amount = subtotal * (tax_rate / Decimal("100"))
    total = subtotal + tax_amount

    # 5. Generate budget number
    budget_number = await _generate_budget_number(db, company_id)

    # 6. Create budget
    try:
        budget = Budget(
            company_id=company_id,
            client_id=client.id,
            installation_id=installation_id,
            budget_number=budget_number,
            title=title,
            subtotal=subtotal,
            tax_rate=tax_rate,
            tax_amount=tax_amount,
            total=total,
            status="draft",
            notes=notes,
            created_by=user["id"],
        )
        db.add(budget)
        await db.flush()

        for item_data in budget_items:
            item = BudgetItem(
                budget_id=budget.id,
                product_id=item_data["product_id"],
                description=item_data["description"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                total=item_data["total"],
                sort_order=item_data["sort_order"],
            )
            db.add(item)

        await db.commit()

        items_text = "\n".join(items_summary)
        return json.dumps(
            {
                "success": True,
                "message": (
                    f"Presupuesto {budget_number} creado para {client.name}.\n"
                    f"Título: {title}\n"
                    f"Ítems:\n{items_text}\n"
                    f"Subtotal: ${float(subtotal):,.2f}\n"
                    f"IVA ({float(tax_rate)}%): ${float(tax_amount):,.2f}\n"
                    f"Total: ${float(total):,.2f}\n"
                    f"Estado: Borrador"
                ),
                "budget_id": str(budget.id),
                "budget_number": budget_number,
                "total": float(total),
            },
            ensure_ascii=False,
        )
    except Exception as e:
        await db.rollback()
        return json.dumps(
            {"error": f"Error al crear el presupuesto: {str(e)}"},
            ensure_ascii=False,
        )
