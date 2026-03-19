"""Budgets (Presupuestos) router."""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.database import get_db
from app.models.budget import Budget, BudgetItem
from app.models.client import Client
from app.models.installation import Installation
from app.models.company import Company
from app.schemas.budget import (
    BudgetCreate, BudgetRead, BudgetUpdate, BudgetListRead,
    BudgetStatusUpdate, BudgetItemCreate,
)

router = APIRouter(prefix="/budgets", tags=["Budgets"])


# ── Helpers ──

async def _generate_budget_number(db: AsyncSession, company_id: uuid.UUID) -> str:
    """Generate sequential budget number: PRES-2026-001."""
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


def _calculate_totals(items: list, tax_rate: Decimal):
    """Calculate item totals, subtotal, tax, and grand total."""
    subtotal = Decimal("0")
    for item in items:
        item_total = Decimal(str(item.quantity)) * Decimal(str(item.unit_price))
        subtotal += item_total
    tax_amount = subtotal * (Decimal(str(tax_rate)) / Decimal("100"))
    total = subtotal + tax_amount
    return subtotal, tax_amount, total


# ── Endpoints ──

@router.get("/", response_model=List[BudgetListRead])
async def list_budgets(
    status: Optional[str] = Query(None),
    client_id: Optional[uuid.UUID] = Query(None),
    installation_id: Optional[uuid.UUID] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List budgets with filters. Returns client/installation names."""
    query = (
        select(
            Budget,
            Client.name.label("client_name"),
            Installation.location_name.label("installation_name"),
        )
        .outerjoin(Client, Budget.client_id == Client.id)
        .outerjoin(Installation, Budget.installation_id == Installation.id)
        .where(Budget.company_id == current_user["company_id"])
        .order_by(Budget.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    if status:
        query = query.where(Budget.status == status)
    if client_id:
        query = query.where(Budget.client_id == client_id)
    if installation_id:
        query = query.where(Budget.installation_id == installation_id)
    if search:
        query = query.where(
            Budget.title.ilike(f"%{search}%") | Budget.budget_number.ilike(f"%{search}%")
        )

    result = await db.execute(query)
    rows = result.all()

    return [
        BudgetListRead(
            id=row.Budget.id,
            company_id=row.Budget.company_id,
            client_id=row.Budget.client_id,
            installation_id=row.Budget.installation_id,
            budget_number=row.Budget.budget_number,
            title=row.Budget.title,
            subtotal=row.Budget.subtotal,
            tax_rate=row.Budget.tax_rate,
            tax_amount=row.Budget.tax_amount,
            total=row.Budget.total,
            status=row.Budget.status,
            valid_until=row.Budget.valid_until,
            client_name=row.client_name,
            installation_name=row.installation_name,
            created_at=row.Budget.created_at,
            updated_at=row.Budget.updated_at,
        )
        for row in rows
    ]


@router.get("/{budget_id}", response_model=BudgetRead)
async def get_budget(
    budget_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get a single budget with all items."""
    query = (
        select(Budget)
        .options(selectinload(Budget.items))
        .where(
            Budget.id == budget_id,
            Budget.company_id == current_user["company_id"],
        )
    )
    result = await db.execute(query)
    budget = result.scalar_one_or_none()

    if not budget:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")

    return budget


@router.post("/", response_model=BudgetRead, status_code=201)
async def create_budget(
    data: BudgetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create a budget with items. Auto-calculates totals and generates budget number."""
    company_id = current_user["company_id"]

    # Validate client if provided
    if data.client_id:
        client_check = await db.execute(
            select(Client.id).where(Client.id == data.client_id, Client.company_id == company_id)
        )
        if not client_check.scalar():
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # Validate installation if provided
    if data.installation_id:
        inst_check = await db.execute(
            select(Installation.id).where(
                Installation.id == data.installation_id,
                Installation.company_id == company_id,
            )
        )
        if not inst_check.scalar():
            raise HTTPException(status_code=404, detail="Instalación no encontrada")

    # Generate budget number
    budget_number = await _generate_budget_number(db, company_id)

    # Calculate totals
    subtotal, tax_amount, total = _calculate_totals(data.items, data.tax_rate)

    # Create budget
    budget = Budget(
        company_id=company_id,
        client_id=data.client_id,
        installation_id=data.installation_id,
        budget_number=budget_number,
        title=data.title,
        description=data.description,
        subtotal=subtotal,
        tax_rate=data.tax_rate,
        tax_amount=tax_amount,
        total=total,
        valid_until=data.valid_until,
        notes=data.notes,
        created_by=current_user["id"],
    )
    db.add(budget)
    await db.flush()  # Get the budget.id

    # Create items
    for i, item_data in enumerate(data.items):
        item = BudgetItem(
            budget_id=budget.id,
            product_id=item_data.product_id,
            description=item_data.description,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            total=Decimal(str(item_data.quantity)) * Decimal(str(item_data.unit_price)),
            sort_order=item_data.sort_order if item_data.sort_order else i,
        )
        db.add(item)

    await db.commit()

    # Reload with items
    result = await db.execute(
        select(Budget).options(selectinload(Budget.items)).where(Budget.id == budget.id)
    )
    return result.scalar_one()


@router.put("/{budget_id}", response_model=BudgetRead)
async def update_budget(
    budget_id: uuid.UUID,
    data: BudgetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update a budget. Items use full-replace strategy. Only editable if draft."""
    company_id = current_user["company_id"]

    result = await db.execute(
        select(Budget)
        .options(selectinload(Budget.items))
        .where(Budget.id == budget_id, Budget.company_id == company_id)
    )
    budget = result.scalar_one_or_none()

    if not budget:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")

    if budget.status != "draft":
        raise HTTPException(status_code=400, detail="Solo se pueden editar presupuestos en estado borrador")

    # Update scalar fields
    update_data = data.model_dump(exclude_unset=True, exclude={"items"})
    for key, value in update_data.items():
        setattr(budget, key, value)

    # Replace items if provided
    if data.items is not None:
        # Delete existing items
        await db.execute(delete(BudgetItem).where(BudgetItem.budget_id == budget.id))

        # Recalculate totals
        tax_rate = data.tax_rate if data.tax_rate is not None else budget.tax_rate
        subtotal, tax_amount, total = _calculate_totals(data.items, tax_rate)
        budget.subtotal = subtotal
        budget.tax_amount = tax_amount
        budget.total = total

        # Create new items
        for i, item_data in enumerate(data.items):
            item = BudgetItem(
                budget_id=budget.id,
                product_id=item_data.product_id,
                description=item_data.description,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total=Decimal(str(item_data.quantity)) * Decimal(str(item_data.unit_price)),
                sort_order=item_data.sort_order if item_data.sort_order else i,
            )
            db.add(item)

    await db.commit()

    # Reload
    result = await db.execute(
        select(Budget).options(selectinload(Budget.items)).where(Budget.id == budget.id)
    )
    return result.scalar_one()


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(
    budget_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete a budget. Only if draft."""
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.company_id == current_user["company_id"])
    )
    budget = result.scalar_one_or_none()

    if not budget:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")

    if budget.status != "draft":
        raise HTTPException(status_code=400, detail="Solo se pueden eliminar presupuestos en estado borrador")

    await db.delete(budget)
    await db.commit()
    return None


@router.patch("/{budget_id}/status", response_model=BudgetRead)
async def update_budget_status(
    budget_id: uuid.UUID,
    data: BudgetStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Change budget status with transition validation."""
    valid_transitions = {
        "draft": ["sent"],
        "sent": ["approved", "rejected", "draft"],
        "rejected": ["draft"],
        "approved": [],
    }

    result = await db.execute(
        select(Budget)
        .options(selectinload(Budget.items))
        .where(Budget.id == budget_id, Budget.company_id == current_user["company_id"])
    )
    budget = result.scalar_one_or_none()

    if not budget:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")

    allowed = valid_transitions.get(budget.status, [])
    if data.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"No se puede cambiar de '{budget.status}' a '{data.status}'. Transiciones válidas: {allowed}",
        )

    budget.status = data.status
    await db.commit()
    await db.refresh(budget)

    return budget


@router.get("/{budget_id}/pdf")
async def get_budget_pdf(
    budget_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Generate and return PDF for a budget."""
    # Lazy import to keep startup fast
    from app.services.budget_pdf_service import generate_budget_pdf

    # Load budget with items + each item's product (for SKU), client, installation, and company
    from sqlalchemy.orm import subqueryload
    result = await db.execute(
        select(Budget)
        .options(
            selectinload(Budget.items).selectinload(BudgetItem.product)
        )
        .where(Budget.id == budget_id, Budget.company_id == current_user["company_id"])
    )
    budget = result.scalar_one_or_none()

    if not budget:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")

    # Load client
    client = None
    if budget.client_id:
        client_result = await db.execute(select(Client).where(Client.id == budget.client_id))
        client = client_result.scalar_one_or_none()

    # Load installation
    installation = None
    if budget.installation_id:
        inst_result = await db.execute(select(Installation).where(Installation.id == budget.installation_id))
        installation = inst_result.scalar_one_or_none()

    # Load company
    company_result = await db.execute(select(Company).where(Company.id == budget.company_id))
    company = company_result.scalar_one_or_none()

    pdf_bytes = generate_budget_pdf(budget, client, installation, company)

    filename = f"{budget.budget_number or 'presupuesto'}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{budget_id}/duplicate", response_model=BudgetRead, status_code=201)
async def duplicate_budget(
    budget_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Duplicate a budget as a new draft."""
    company_id = current_user["company_id"]

    result = await db.execute(
        select(Budget)
        .options(selectinload(Budget.items))
        .where(Budget.id == budget_id, Budget.company_id == company_id)
    )
    original = result.scalar_one_or_none()

    if not original:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")

    budget_number = await _generate_budget_number(db, company_id)

    new_budget = Budget(
        company_id=company_id,
        client_id=original.client_id,
        installation_id=original.installation_id,
        budget_number=budget_number,
        title=f"{original.title} (copia)",
        description=original.description,
        subtotal=original.subtotal,
        tax_rate=original.tax_rate,
        tax_amount=original.tax_amount,
        total=original.total,
        status="draft",
        valid_until=original.valid_until,
        notes=original.notes,
        created_by=current_user["id"],
    )
    db.add(new_budget)
    await db.flush()

    for item in original.items:
        new_item = BudgetItem(
            budget_id=new_budget.id,
            product_id=item.product_id,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total=item.total,
            sort_order=item.sort_order,
        )
        db.add(new_item)

    await db.commit()

    result = await db.execute(
        select(Budget).options(selectinload(Budget.items)).where(Budget.id == new_budget.id)
    )
    return result.scalar_one()
