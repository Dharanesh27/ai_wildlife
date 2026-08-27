from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status, HTTPException
from app.api.dependencies import get_current_user, get_user_repository, RoleChecker
from app.domain.models.user import User, UserRole
from app.domain.schemas.user import UserOut, UserCreate
from app.repositories.user_repo import UserRepository

router = APIRouter()

# Enforce Administrator role for all requests in this router
require_admin = Depends(RoleChecker([UserRole.ADMINISTRATOR]))

@router.post("/create", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def admin_create_user(
    user_in: UserCreate,
    current_user: User = require_admin,
    user_repo: UserRepository = Depends(get_user_repository),
) -> User:
    """Allow an administrator to directly create a new active user account."""
    existing_user = await user_repo.get_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    # Force active state to True for direct Admin creation
    user_in.is_active = True
    user = await user_repo.create_user(obj_in=user_in)
    return user

@router.get("/pending", response_model=List[UserOut])
async def get_pending_registrations(
    current_user: User = require_admin,
    user_repo: UserRepository = Depends(get_user_repository),
) -> List[User]:
    """Retrieve all pending (inactive) user registration requests."""
    return await user_repo.get_pending_users()

@router.put("/{user_id}/approve", response_model=UserOut)
async def approve_user_registration(
    user_id: UUID,
    current_user: User = require_admin,
    user_repo: UserRepository = Depends(get_user_repository),
) -> User:
    """Approve a pending user registration request, activating their account."""
    target_user = await user_repo.get(user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User registration request not found."
        )
    if target_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is already active."
        )
    
    # Update active status to True
    updated_user = await user_repo.update(db_obj=target_user, obj_in={"is_active": True})
    return updated_user

@router.delete("/{user_id}/reject", response_model=UserOut)
async def reject_user_registration(
    user_id: UUID,
    current_user: User = require_admin,
    user_repo: UserRepository = Depends(get_user_repository),
) -> User:
    """Reject and delete a pending user registration request."""
    target_user = await user_repo.get(user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User registration request not found."
        )
    if target_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reject an already active account."
        )
    
    deleted_user = await user_repo.remove(id=user_id)
    return deleted_user
