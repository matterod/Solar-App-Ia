from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.company import Company
from app.schemas.plan import PlanUsage, CompanyAdmin
from app.services.plan_limits import get_usage

router = APIRouter(prefix="", tags=["Plan & Admin"])

def require_superadmin():
    async def checker(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
        user_result = await db.execute(select(User).where(User.id == current_user["id"]))
        user = user_result.scalar_one()
        if not user.is_superadmin:
            raise HTTPException(status_code=403, detail="Acceso restringido a super administradores.")
        return current_user
    return checker

# --- Plan Usage ---

@router.get("/plan/usage", response_model=PlanUsage)
async def get_plan_usage(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns current plan + usage stats for their company."""
    usage_stats = await get_usage(current_user, db)
    return usage_stats

# --- Super Admin Panel Endpoints ---

@router.get("/admin/companies", response_model=List[CompanyAdmin])
async def list_all_companies(
    current_user: dict = Depends(require_superadmin()),
    db: AsyncSession = Depends(get_db)
):
    """Lists ALL companies with user count, plan, status."""
    result = await db.execute(
        select(Company)
        .options(selectinload(Company.users))
        .order_by(Company.created_at.desc(), Company.id)
    )
    companies = result.scalars().all()
    
    response = []
    for c in companies:
        response.append({
            "id": c.id,
            "name": c.name,
            "plan": c.plan.name if hasattr(c.plan, "name") else str(c.plan), # Handling enum serialization
            "subscription_status": c.subscription_status.name if hasattr(c.subscription_status, "name") else str(c.subscription_status),
            "user_count": len(c.users),
            "created_at": c.created_at
        })
    return response

@router.put("/admin/companies/{company_id}/plan", response_model=CompanyAdmin)
async def change_company_plan(
    company_id: UUID,
    plan: str = Body(embed=True),
    current_user: dict = Depends(require_superadmin()),
    db: AsyncSession = Depends(get_db)
):
    """Changes a company's plan (demo <-> pro)."""
    if plan not in ["demo", "pro"]:
        raise HTTPException(status_code=400, detail="El plan debe ser 'demo' o 'pro'")
        
    result = await db.execute(select(Company).options(selectinload(Company.users)).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
    company.plan = plan
    await db.commit()
    await db.refresh(company)
    
    return {
        "id": company.id,
        "name": company.name,
        "plan": company.plan,
        "subscription_status": company.subscription_status,
        "user_count": len(company.users),
        "created_at": company.created_at
    }

@router.get("/admin/stats")
async def get_admin_stats(
    current_user: dict = Depends(require_superadmin()),
    db: AsyncSession = Depends(get_db)
):
    """Global stats: total companies, total users, demo vs pro counts."""
    # Total companies
    total_companies = (await db.execute(select(func.count()).select_from(Company))).scalar() or 0
    
    # Total users
    total_users = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
    
    # Demo vs Pro
    demo_count = (await db.execute(select(func.count()).select_from(Company).where(Company.plan == "demo"))).scalar() or 0
    pro_count = (await db.execute(select(func.count()).select_from(Company).where(Company.plan == "pro"))).scalar() or 0
    
    return {
        "total_companies": total_companies,
        "total_users": total_users,
        "demo_count": demo_count,
        "pro_count": pro_count
    }
