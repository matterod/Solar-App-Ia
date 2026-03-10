"""Auth router — get current user from Firebase Token."""

from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserRead

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/me", response_model=UserRead)
async def get_me(current_user: dict = Depends(get_current_user)):    
    """Get current authenticated user."""
    return current_user
