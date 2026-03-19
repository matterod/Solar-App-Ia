from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc, update
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from uuid import UUID

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.problem import Problem
from app.models.solution import Solution

router = APIRouter(prefix="/problems", tags=["Problems"])

# Schemas
class SolutionBase(BaseModel):
    description: str

class SolutionCreate(SolutionBase):
    pass

class SolutionResponse(SolutionBase):
    id: UUID
    problem_id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ProblemBase(BaseModel):
    title: str
    description: str
    status: str = "open"
    tags: List[str] = []

class ProblemCreate(ProblemBase):
    pass

class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None

class ProblemResponse(ProblemBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    solutions: List[SolutionResponse] = []
    model_config = ConfigDict(from_attributes=True)


@router.post("/", response_model=ProblemResponse)
async def create_problem(
    problem: ProblemCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_obj = Problem(company_id=current_user["company_id"], **problem.model_dump())
    db.add(db_obj)
    await db.commit()
    # Re-fetch with selectinload so the solutions relationship is ready for serialization
    result = await db.execute(
        select(Problem).options(selectinload(Problem.solutions)).where(Problem.id == db_obj.id)
    )
    return result.scalar_one()

@router.get("/", response_model=List[ProblemResponse])
async def get_problems(
    search: Optional[str] = None, 
    status: Optional[str] = None, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = select(Problem).options(selectinload(Problem.solutions)).where(Problem.company_id == current_user["company_id"])
    
    if search:
        q = q.where(or_(Problem.title.ilike(f"%{search}%"), Problem.description.ilike(f"%{search}%")))
    if status:
        q = q.where(Problem.status == status)
    
    q = q.order_by(desc(Problem.created_at))
    result = await db.execute(q)
    return result.scalars().all()

@router.get("/{problem_id}", response_model=ProblemResponse)
async def get_problem(
    problem_id: UUID, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = select(Problem).options(selectinload(Problem.solutions)).where(
        Problem.id == problem_id, 
        Problem.company_id == current_user["company_id"]

    )
    result = await db.execute(q)
    db_obj = result.scalar_one_or_none()
    
    if not db_obj:
        raise HTTPException(status_code=404, detail="Problem not found")
    return db_obj

@router.put("/{problem_id}", response_model=ProblemResponse)
async def update_problem(
    problem_id: UUID, 
    update_data: ProblemUpdate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = select(Problem).options(selectinload(Problem.solutions)).where(
        Problem.id == problem_id, 
        Problem.company_id == current_user["company_id"]

    )
    result = await db.execute(q)
    db_obj = result.scalar_one_or_none()
    
    if not db_obj:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    
    await db.commit()
    # Re-fetch with selectinload to avoid lazy-load issues on solutions
    result = await db.execute(
        select(Problem).options(selectinload(Problem.solutions)).where(Problem.id == db_obj.id)
    )
    return result.scalar_one()

@router.post("/{problem_id}/solutions", response_model=SolutionResponse)
async def add_solution(
    problem_id: UUID, 
    solution: SolutionCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = select(Problem).where(
        Problem.id == problem_id, 
        Problem.company_id == current_user["company_id"]

    )
    result = await db.execute(q)
    db_problem = result.scalar_one_or_none()
    
    if not db_problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    db_solution = Solution(**solution.model_dump(), problem_id=problem_id)
    db.add(db_solution)
    db_problem.status = "resolved"
    await db.commit()
    await db.refresh(db_solution)
    return db_solution
