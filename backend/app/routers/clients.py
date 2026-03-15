"""Clients router — CRUD operations."""

from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.client import Client
from app.models.user import User
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate
from app.services.plan_limits import check_limit

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("/", response_model=List[ClientRead])
async def list_clients(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List all clients with optional search."""
    query = select(Client).where(Client.company_id == current_user["company_id"]).offset(skip).limit(limit).order_by(Client.name)
    if search:
        query = query.where(Client.name.ilike(f"%{search}%"))
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{client_id}", response_model=ClientRead)
async def get_client(
    client_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get a single client by ID."""
    result = await db.execute(select(Client).where(Client.company_id == current_user["company_id"]).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.post("/", response_model=ClientRead, status_code=201)
async def create_client(
    data: ClientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    _limit=Depends(check_limit("clients")),
):
    """Create a new client."""
    client = Client(company_id=current_user["company_id"], **data.model_dump(), created_by=current_user["id"])
    db.add(client)
    await db.flush()
    await db.refresh(client)
    return client


@router.put("/{client_id}", response_model=ClientRead)
async def update_client(
    client_id: uuid.UUID,
    data: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update a client."""
    result = await db.execute(select(Client).where(Client.company_id == current_user["company_id"]).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(client, field, value)

    await db.flush()
    await db.refresh(client)
    return client


@router.delete("/{client_id}", status_code=204)
async def delete_client(
    client_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete a client."""
    result = await db.execute(select(Client).where(Client.company_id == current_user["company_id"]).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    await db.delete(client)
