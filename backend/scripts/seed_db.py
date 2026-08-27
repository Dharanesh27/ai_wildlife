import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings
from app.database.base import Base
from app.domain.models.user import User, UserRole
from app.domain.models.survey import (
    SurveySite,
    Device,
    Observation,
    EcosystemHealthLog,
    Recommendation,
    DeviceType,
    DeviceStatus,
    ObservationType,
    ThreatLevel,
    RecommendationPriority,
    RecommendationStatus,
)
from app.core.security import get_password_hash


async def seed():
    print("Connecting to database...")
    engine = create_async_engine(settings.async_database_url, echo=False)
    async_session_maker = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        print("Creating tables if they do not exist...")
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as db:
        # Check if database is already seeded
        from sqlalchemy.future import select
        res = await db.execute(select(User).limit(1))
        if res.scalars().first():
            print("Database already contains data. Skipping seeding.")
            return

        print("Seeding initial data...")

        # 1. Create Default Users
        researcher = User(
            email="researcher@wildlife.gov",
            hashed_password=get_password_hash("password123"),
            first_name="Jane",
            last_name="Doe",
            role=UserRole.WILDLIFE_RESEARCHER,
            is_active=True,
        )
        officer = User(
            email="officer@wildlife.gov",
            hashed_password=get_password_hash("password123"),
            first_name="John",
            last_name="Smith",
            role=UserRole.CONSERVATION_OFFICER,
            is_active=True,
        )
        admin = User(
            email="admin@wildlife.gov",
            hashed_password=get_password_hash("password123"),
            first_name="Admin",
            last_name="Console",
            role=UserRole.ADMINISTRATOR,
            is_active=True,
        )
        db.add_all([researcher, officer, admin])
        await db.commit()
        print("Users seeded: researcher@wildlife.gov, officer@wildlife.gov, admin@wildlife.gov (password: password123)")

        # 2. Create Survey Sites
        site_c = SurveySite(
            name="Mudumalai Tiger Reserve",
            description="Nilgiri Biosphere Reserve corridor, high density of Bengal Tigers, Indian Elephants, and leopards.",
            location_name="Nilgiri Hills, Tamil Nadu",
            latitude=11.5623,
            longitude=76.5345,
            habitat_type="Forest",
            is_protected_area=True,
        )
        site_w = SurveySite(
            name="Anamalai Tiger Reserve",
            description="Western Ghats tropical wet forest sanctuary, key breeding grounds for Nilgiri tahr.",
            location_name="Anamalai Hills, Tamil Nadu",
            latitude=10.3831,
            longitude=76.9743,
            habitat_type="Wetland",
            is_protected_area=True,
        )
        db.add_all([site_c, site_w])
        await db.commit()
        await db.refresh(site_c)
        await db.refresh(site_w)
        print("Survey Sites seeded.")

        # 3. Create Devices
        d1 = Device(
            name="Camera Trap M1 (Moyar Path)",
            device_type=DeviceType.CAMERA_TRAP,
            status=DeviceStatus.ACTIVE,
            battery_level=92.5,
            latitude=11.5645,
            longitude=76.5360,
            site_id=site_c.id,
        )
        d2 = Device(
            name="Acoustic Node M2 (Scrub Gorge)",
            device_type=DeviceType.AUDIO_SENSOR,
            status=DeviceStatus.ACTIVE,
            battery_level=87.0,
            latitude=11.5610,
            longitude=76.5312,
            site_id=site_c.id,
        )
        d3 = Device(
            name="Acoustic Node A1 (Wetland Canopy)",
            device_type=DeviceType.AUDIO_SENSOR,
            status=DeviceStatus.ACTIVE,
            battery_level=98.2,
            latitude=10.3845,
            longitude=76.9760,
            site_id=site_w.id,
        )
        d4 = Device(
            name="Camera Trap A2 (Tahr Crossing)",
            device_type=DeviceType.CAMERA_TRAP,
            status=DeviceStatus.MAINTENANCE,
            battery_level=12.4,
            latitude=10.3812,
            longitude=76.9720,
            site_id=site_w.id,
        )
        db.add_all([d1, d2, d3, d4])
        await db.commit()
        await db.refresh(d1)
        await db.refresh(d2)
        await db.refresh(d3)
        await db.refresh(d4)
        print("Devices seeded.")

        # 4. Create Historical Observations
        now = datetime.now(timezone.utc)
        obs_list = [
            # Tiger Sightings in Zone C
            Observation(
                device_id=d1.id,
                observation_type=ObservationType.IMAGE,
                file_url="https://images.unsplash.com/photo-1615963244664-5b844b2025ee",
                detected_species="Bengal Tiger (Panthera tigris)",
                taxonomic_class="Mammalia",
                confidence=96.8,
                count=1,
                behavior="Walking / Patrol",
                bounding_box={"box": [120, 80, 410, 380]},
                health_index=9.2,
                threat_level=ThreatLevel.NONE,
                timestamp=now - timedelta(hours=2),
            ),
            Observation(
                device_id=d1.id,
                observation_type=ObservationType.IMAGE,
                file_url="https://images.unsplash.com/photo-1615963244664-5b844b2025ee",
                detected_species="Bengal Tiger (Panthera tigris)",
                taxonomic_class="Mammalia",
                confidence=92.1,
                count=2,
                behavior="Mating Pair / Resting",
                bounding_box={"box": [50, 60, 320, 290]},
                health_index=9.0,
                threat_level=ThreatLevel.NONE,
                timestamp=now - timedelta(days=2),
            ),
            # Elephant Sightings in Zone C
            Observation(
                device_id=d1.id,
                observation_type=ObservationType.IMAGE,
                file_url="https://images.unsplash.com/photo-1581852013747-d4f15743b355",
                detected_species="Asian Elephant (Elephas maximus)",
                taxonomic_class="Mammalia",
                confidence=95.4,
                count=3,
                behavior="Feeding / Herd migration",
                bounding_box={"box": [30, 100, 580, 450]},
                health_index=8.8,
                threat_level=ThreatLevel.NONE,
                timestamp=now - timedelta(days=1),
            ),
            # Leopard Sightings in Zone C
            Observation(
                device_id=d1.id,
                observation_type=ObservationType.IMAGE,
                file_url=None,
                detected_species="Indian Leopard (Panthera pardus)",
                taxonomic_class="Mammalia",
                confidence=89.5,
                count=1,
                behavior="Climbing Tree",
                bounding_box=None,
                health_index=8.4,
                threat_level=ThreatLevel.NONE,
                timestamp=now - timedelta(days=4),
            ),
            # Threat alert in Zone C (Gunshot event detected via audio sensor)
            Observation(
                device_id=d2.id,
                observation_type=ObservationType.AUDIO,
                file_url=None,
                detected_species="Poaching / Gunshot Sensation",
                taxonomic_class="Acoustic Event",
                confidence=91.0,
                count=1,
                behavior="Gunshot Burst",
                bounding_box=None,
                health_index=None,
                threat_level=ThreatLevel.CRITICAL,
                threat_details="Bioacoustic spike matching rifle discharge threshold in buffer forest edge.",
                timestamp=now - timedelta(minutes=15),
            ),
            # Bird Calls in Wetlands
            Observation(
                device_id=d3.id,
                observation_type=ObservationType.AUDIO,
                file_url=None,
                detected_species="Sarus Crane (Grus antigone)",
                taxonomic_class="Aves",
                confidence=94.2,
                count=2,
                behavior="Mating Call",
                bounding_box=None,
                health_index=8.7,
                threat_level=ThreatLevel.NONE,
                timestamp=now - timedelta(hours=4),
            ),
            Observation(
                device_id=d3.id,
                observation_type=ObservationType.AUDIO,
                file_url=None,
                detected_species="Sarus Crane (Grus antigone)",
                taxonomic_class="Aves",
                confidence=88.7,
                count=1,
                behavior="Foraging",
                bounding_box=None,
                health_index=8.5,
                threat_level=ThreatLevel.NONE,
                timestamp=now - timedelta(days=3),
            ),
        ]
        db.add_all(obs_list)
        await db.commit()
        print("Historical Observations seeded.")

        # 5. Create initial Ecosystem Health Logs
        # Zone-C health calculations
        log_c = EcosystemHealthLog(
            site_id=site_c.id,
            biodiversity_score=6.0,  # 3 species: Tiger, Elephant, Leopard (3*2.0=6.0)
            habitat_quality_score=9.0,  # Protected area
            population_stability_score=8.5,
            endangered_species_status_score=9.1,  # Tigers & Elephants present
            environmental_conditions_score=7.0,  # Gunshot alert deducted some points
            overall_health_score=7.86,  # Weighted sum
            logged_at=now - timedelta(minutes=10),
        )
        # Western Wetlands health calculations
        log_w = EcosystemHealthLog(
            site_id=site_w.id,
            biodiversity_score=2.0,  # 1 species: Sarus Crane
            habitat_quality_score=9.0,
            population_stability_score=8.5,
            endangered_species_status_score=5.0,
            environmental_conditions_score=10.0,  # No threats
            overall_health_score=6.45,
            logged_at=now - timedelta(minutes=10),
        )
        db.add_all([log_c, log_w])
        await db.commit()
        print("Ecosystem Health Logs seeded.")

        # 6. Create initial active Recommendations
        r1 = Recommendation(
            site_id=site_c.id,
            title="Reallocate Drone Patrol Pattern - Sector 4",
            description="Frequent gunshot acoustic alerts matching YAMNet threshold metrics detected in the adjacent buffer forest. Recommendation is to schedule drone inspection routes during dusk and dawn intervals.",
            priority=RecommendationPriority.CRITICAL,
            status=RecommendationStatus.OPEN,
            created_at=now - timedelta(minutes=14),
        )
        r2 = Recommendation(
            site_id=site_w.id,
            title="Mitigate Habitat Degradation risk in Wet Buffer Zones",
            description="Ecosystem analysis signals a 4.5% decline in vegetative water indexes (NDVI). Deploy sensor telemetry checking upstream dams or agricultural runoff.",
            priority=RecommendationPriority.MEDIUM,
            status=RecommendationStatus.OPEN,
            created_at=now - timedelta(days=1),
        )
        db.add_all([r1, r2])
        await db.commit()
        print("Recommendations seeded.")

        print("Database seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
