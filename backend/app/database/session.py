from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

# PostgreSQL Configuration
engine = create_async_engine(
    settings.async_database_url,
    echo=False,
    future=True,
    pool_size=10,
    max_overflow=20,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# MongoDB Configuration
class MongoDatabase:
    client: AsyncIOMotorClient = None
    db = None

    def connect(self):
        self.client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
        self.db = self.client[settings.MONGO_DB_NAME]

    def close(self):
        if self.client:
            self.client.close()


mongo_db = MongoDatabase()


def get_mongo_db():
    if mongo_db.db is None:
        mongo_db.connect()
    return mongo_db.db
