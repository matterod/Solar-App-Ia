from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from uuid import UUID

from app.database import get_db
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
def create_problem(problem: ProblemCreate, db: Session = Depends(get_db)):
    db_obj = Problem(**problem.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/", response_model=List[ProblemResponse])
def get_problems(search: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Problem)
    if search:
        q = q.filter(or_(Problem.title.ilike(f"%{search}%"), Problem.description.ilike(f"%{search}%")))
    if status:
        q = q.filter(Problem.status == status)
    
    return q.order_by(desc(Problem.created_at)).all()

@router.get("/{problem_id}", response_model=ProblemResponse)
def get_problem(problem_id: UUID, db: Session = Depends(get_db)):
    db_obj = db.query(Problem).filter(Problem.id == problem_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Problem not found")
    return db_obj

@router.put("/{problem_id}", response_model=ProblemResponse)
def update_problem(problem_id: UUID, update_data: ProblemUpdate, db: Session = Depends(get_db)):
    db_obj = db.query(Problem).filter(Problem.id == problem_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, value)
    
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.post("/{problem_id}/solutions", response_model=SolutionResponse)
def add_solution(problem_id: UUID, solution: SolutionCreate, db: Session = Depends(get_db)):
    db_problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not db_problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    db_solution = Solution(**solution.model_dump(), problem_id=problem_id)
    db.add(db_solution)
    # Automatically resolve problem when solution is added
    db_problem.status = "resolved"
    db.commit()
    db.refresh(db_solution)
    return db_solution
