from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.dependencies import get_current_user, get_user_repository
from app.core.exceptions import CustomHTTPException, DuplicateResourceException
from app.domain.models.user import User
from app.domain.schemas.user import Token, UserCreate, UserOut
from app.repositories.user_repo import UserRepository
from app.core.security import create_access_token

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    user_repo: UserRepository = Depends(get_user_repository),
) -> Any:
    """
    Register a new user in the system.
    """
    existing_user = await user_repo.get_by_email(user_in.email)
    if existing_user:
        raise DuplicateResourceException("A user with this email already exists.")
    user = await user_repo.create_user(obj_in=user_in)
    return user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_repo: UserRepository = Depends(get_user_repository),
) -> Any:
    """
    OAuth2 compatible token login, retrieve a JWT access token.
    """
    user = await user_repo.authenticate(
        email=form_data.username, password=form_data.password
    )
    if not user:
        raise CustomHTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    elif not user.is_active:
        raise CustomHTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
        
    access_token = create_access_token(subject=user.id)
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserOut)
async def read_user_me(
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get current logged in user details.
    """
    return current_user
