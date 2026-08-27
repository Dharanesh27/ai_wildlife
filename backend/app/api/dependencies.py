from typing import Generator, List
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
import jwt
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import CredentialsException, PermissionDeniedException
from app.core.security import ALGORITHM
from app.database.session import get_db
from app.domain.models.user import User, UserRole
from app.domain.schemas.user import TokenData
from app.repositories.user_repo import UserRepository
from app.repositories.survey_repo import (
    SurveySiteRepository,
    DeviceRepository,
    ObservationRepository,
    EcosystemHealthLogRepository,
    RecommendationRepository,
)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


async def get_user_repository(db: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


async def get_survey_site_repository(db: AsyncSession = Depends(get_db)) -> SurveySiteRepository:
    return SurveySiteRepository(db)


async def get_device_repository(db: AsyncSession = Depends(get_db)) -> DeviceRepository:
    return DeviceRepository(db)


async def get_observation_repository(db: AsyncSession = Depends(get_db)) -> ObservationRepository:
    return ObservationRepository(db)


async def get_ecosystem_health_log_repository(db: AsyncSession = Depends(get_db)) -> EcosystemHealthLogRepository:
    return EcosystemHealthLogRepository(db)


async def get_recommendation_repository(db: AsyncSession = Depends(get_db)) -> RecommendationRepository:
    return RecommendationRepository(db)



async def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: UserRepository = Depends(get_user_repository),
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        token_data = TokenData(user_id=payload.get("sub"))
        if token_data.user_id is None:
            raise CredentialsException()
    except (jwt.PyJWTError, ValidationError):
        raise CredentialsException()
        
    user = await user_repo.get(token_data.user_id)
    if not user:
        raise CredentialsException("User not found")
    if not user.is_active:
        raise PermissionDeniedException("Inactive user")
    return user


class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise PermissionDeniedException(
                f"Role '{current_user.role.value}' does not have permission to access this resource."
            )
        return current_user
