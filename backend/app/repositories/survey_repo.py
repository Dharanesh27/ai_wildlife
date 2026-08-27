from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, func
from app.repositories.base import BaseRepository
from app.domain.models.survey import SurveySite, Device, Observation, EcosystemHealthLog, Recommendation
from app.domain.schemas.survey import (
    SurveySiteCreate,
    DeviceCreate,
    ObservationCreate,
    EcosystemHealthLogCreate,
    RecommendationCreate,
)


class SurveySiteRepository(BaseRepository[SurveySite]):
    def __init__(self, db: AsyncSession):
        super().__init__(SurveySite, db)

    async def get_by_name(self, name: str) -> Optional[SurveySite]:
        query = select(self.model).filter(self.model.name == name)
        result = await self.db.execute(query)
        return result.scalars().first()


class DeviceRepository(BaseRepository[Device]):
    def __init__(self, db: AsyncSession):
        super().__init__(Device, db)

    async def get_by_site(self, site_id: UUID) -> List[Device]:
        query = select(self.model).filter(self.model.site_id == site_id)
        result = await self.db.execute(query)
        return result.scalars().all()


class ObservationRepository(BaseRepository[Observation]):
    def __init__(self, db: AsyncSession):
        super().__init__(Observation, db)

    async def get_by_device(self, device_id: UUID, limit: int = 100) -> List[Observation]:
        query = (
            select(self.model)
            .filter(self.model.device_id == device_id)
            .order_by(desc(self.model.timestamp))
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_recent(self, limit: int = 100) -> List[Observation]:
        query = (
            select(self.model)
            .order_by(desc(self.model.timestamp))
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_site(self, site_id: UUID, limit: int = 100) -> List[Observation]:
        query = (
            select(self.model)
            .join(Device)
            .filter(Device.site_id == site_id)
            .order_by(desc(self.model.timestamp))
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_species_counts(self) -> List[dict]:
        # Returns counts of observations per species
        query = (
            select(self.model.detected_species, func.sum(self.model.count).label("total_count"))
            .group_by(self.model.detected_species)
            .order_by(desc("total_count"))
        )
        result = await self.db.execute(query)
        return [{"species": row[0], "count": row[1]} for row in result.all()]


class EcosystemHealthLogRepository(BaseRepository[EcosystemHealthLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(EcosystemHealthLog, db)

    async def get_by_site(self, site_id: UUID, limit: int = 50) -> List[EcosystemHealthLog]:
        query = (
            select(self.model)
            .filter(self.model.site_id == site_id)
            .order_by(desc(self.model.logged_at))
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_latest_for_site(self, site_id: UUID) -> Optional[EcosystemHealthLog]:
        query = (
            select(self.model)
            .filter(self.model.site_id == site_id)
            .order_by(desc(self.model.logged_at))
            .limit(1)
        )
        result = await self.db.execute(query)
        return result.scalars().first()


class RecommendationRepository(BaseRepository[Recommendation]):
    def __init__(self, db: AsyncSession):
        super().__init__(Recommendation, db)

    async def get_by_site(self, site_id: UUID) -> List[Recommendation]:
        query = select(self.model).filter(self.model.site_id == site_id).order_by(desc(self.model.created_at))
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_active(self) -> List[Recommendation]:
        query = select(self.model).filter(self.model.status != "Resolved").order_by(desc(self.model.created_at))
        result = await self.db.execute(query)
        return result.scalars().all()
