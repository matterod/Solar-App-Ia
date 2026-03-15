"""
Solar ERP — Authentication Utilities (Firebase Auth + Multi-tenant)
Verifies Firebase ID tokens and manages users/companies.
"""

import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
import firebase_admin
from firebase_admin import auth, credentials

from app.database import get_db
from app.models.user import User
from app.models.company import Company

# Initialize Firebase Admin if not already initialized
if not firebase_admin._apps:
    import pathlib
    # Look for serviceAccountKey.json relative to the project root
    key_path = pathlib.Path(__file__).resolve().parent.parent / "serviceAccountKey.json"
    if key_path.exists():
        cred = credentials.Certificate(str(key_path))
        firebase_admin.initialize_app(cred)
    else:
        # Fallback: use default credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS env var)
        try:
            firebase_admin.initialize_app()
        except ValueError:
            pass

security = HTTPBearer()

async def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency: validate Firebase token and fetch/create User and Company."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Verify Firebase Token
        decoded_token = auth.verify_id_token(token.credentials)
        firebase_uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        name = decoded_token.get("name", email.split('@')[0])
        
        if not firebase_uid or not email:
            raise credentials_exception
            
    except Exception as e:
        print(f"Auth error: {e}")
        raise credentials_exception

    # Try to find the user in our DB
    # We include 'company' so we can access current_user.company later
    result = await db.execute(select(User).options(selectinload(User.company)).where(User.firebase_uid == firebase_uid))
    user = result.scalar_one_or_none()
    
    if not user:
        # First time login — check for pending invitations
        from app.models.invitation import CompanyInvitation
        
        # Look for a pending invitation for this email
        inv_result = await db.execute(
            select(CompanyInvitation)
            .where(
                CompanyInvitation.email == email,
                CompanyInvitation.status == "pending"
            )
        )
        invitation = inv_result.scalars().first()
        
        if invitation:
            # Join the invited company
            user = User(
                firebase_uid=firebase_uid,
                email=email,
                full_name=name,
                company_id=invitation.company_id,
                role=invitation.role
            )
            invitation.status = "accepted"
        else:
            # No invitation — create a new demo company
            new_company = Company(
                name=f"Demo de {name}",
                plan="demo"
            )
            db.add(new_company)
            await db.flush()

            user = User(
                firebase_uid=firebase_uid,
                email=email,
                full_name=name,
                company_id=new_company.id,
                role="admin"
            )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "company_id": user.company_id,
        "company_name": user.company.name if user.company else None,
        "plan": user.company.plan if user.company else None,
        "is_superadmin": user.is_superadmin,
        "ai_questions_used": user.message_count,
    }


def require_role(*roles: str):
    """Dependency factory: require user to have one of the specified roles."""
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user["role"] not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return role_checker
