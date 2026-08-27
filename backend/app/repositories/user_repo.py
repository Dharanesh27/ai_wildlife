from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.repositories.base import BaseRepository
from app.domain.models.user import User
from app.domain.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        query = select(self.model).filter(self.model.email == email)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def create_user(self, *, obj_in: UserCreate) -> User:
        db_obj = User(
            email=obj_in.email,
            hashed_password=get_password_hash(obj_in.password),
            first_name=obj_in.first_name,
            last_name=obj_in.last_name,
            role=obj_in.role,
            is_active=obj_in.is_active if obj_in.is_active is not None else True,
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def update_user(
        self, *, db_obj: User, obj_in: UserUpdate
    ) -> User:
        update_data = obj_in.model_dump(exclude_unset=True)
        if "password" in update_data and update_data["password"]:
            hashed_password = get_password_hash(update_data["password"])
            update_data["hashed_password"] = hashed_password
            del update_data["password"]
            
        return await self.update(db_obj=db_obj, obj_in=update_data)

    async def authenticate(
        self, *, email: str, password: str
    ) -> Optional[User]:
        user = await self.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    async def get_pending_users(self) -> list[User]:
        query = select(self.model).filter(self.model.is_active == False)
        result = await self.db.execute(query)
        return list(result.scalars().all())
