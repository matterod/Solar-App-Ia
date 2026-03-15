from typing import Dict, Any, Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.client import Client
from app.models.installation import Installation

PLAN_LIMITS: Dict[str, Dict[str, Optional[int]]] = {
    "demo": {
        "ai_questions": 5,
        "clients": 10,
        "installations": 5,
        "team_members": 3,
    },
    "pro": {
        "ai_questions": None,  # unlimited
        "clients": None,
        "installations": None,
        "team_members": None,
    },
}

def check_limit(resource: str):
    """
    Dependency factory to check if the user's company has exceeded the limit 
    for a specific resource based on their plan type.
    """
    async def checker(
        current_user: dict = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ):
        plan = current_user.get("plan", "demo")
        
        # If the plan is pro or the resource has no limit, allow
        limit = PLAN_LIMITS.get(plan, {}).get(resource)
        if limit is None:
            return current_user
        
        company_id = current_user["company_id"]
        used = 0
        
        if resource == "ai_questions":
            # For AI questions, we read the message_count from the User record
            user_result = await db.execute(select(User.message_count).where(User.id == current_user["id"]))
            used = user_result.scalar_one_or_none() or 0
            if used >= limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Alcanzaste el límite de {limit} consultas de IA en el plan {plan.capitalize()}. Actualizá a Pro para continuar."
                )

        elif resource == "clients":
            count_result = await db.execute(select(func.count()).select_from(Client).where(Client.company_id == company_id))
            used = count_result.scalar() or 0
            if used >= limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Alcanzaste el límite de {limit} clientes en el plan {plan.capitalize()}."
                )

        elif resource == "installations":
            count_result = await db.execute(select(func.count()).select_from(Installation).where(Installation.company_id == company_id))
            used = count_result.scalar() or 0
            if used >= limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Alcanzaste el límite de {limit} instalaciones en el plan {plan.capitalize()}."
                )

        elif resource == "team_members":
            count_result = await db.execute(select(func.count()).select_from(User).where(User.company_id == company_id))
            used = count_result.scalar() or 0
            if used >= limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Alcanzaste el límite de {limit} miembros de equipo en el plan {plan.capitalize()}."
                )
                
        return current_user
        
    return checker


async def get_usage(current_user: dict, db: AsyncSession) -> Dict[str, Any]:
    """Returns current usage stats for the user's company."""
    plan = current_user.get("plan", "demo")
    company_id = current_user["company_id"]
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["demo"])
    
    # AI questions
    user_result = await db.execute(select(User.message_count).where(User.id == current_user["id"]))
    ai_used = user_result.scalar_one_or_none() or 0
    
    # Clients
    clients_result = await db.execute(select(func.count()).select_from(Client).where(Client.company_id == company_id))
    clients_used = clients_result.scalar() or 0
    
    # Installations
    inst_result = await db.execute(select(func.count()).select_from(Installation).where(Installation.company_id == company_id))
    inst_used = inst_result.scalar() or 0
    
    # Team members
    team_result = await db.execute(select(func.count()).select_from(User).where(User.company_id == company_id))
    team_used = team_result.scalar() or 0
    
    return {
        "plan": plan,
        "ai_questions": {"used": ai_used, "limit": limits["ai_questions"]},
        "clients": {"used": clients_used, "limit": limits["clients"]},
        "installations": {"used": inst_used, "limit": limits["installations"]},
        "team_members": {"used": team_used, "limit": limits["team_members"]},
    }
