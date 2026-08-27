import uuid
from enum import Enum
from sqlalchemy import Boolean, Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database.base import Base


class UserRole(str, Enum):
    ADMINISTRATOR = "Administrator"
    WILDLIFE_RESEARCHER = "Wildlife Researcher"
    CONSERVATION_OFFICER = "Conservation Officer"
    FOREST_DEPARTMENT_OFFICER = "Forest Department Officer"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.WILDLIFE_RESEARCHER)
    is_active = Column(Boolean(), default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
