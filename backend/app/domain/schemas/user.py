from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.domain.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole = UserRole.WILDLIFE_RESEARCHER


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    is_active: Optional[bool] = True


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


class UserOut(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[str] = None
