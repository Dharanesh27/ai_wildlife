from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.auth import router as auth_router
from app.api.v1.survey import router as survey_router
from app.api.v1.reports import router as reports_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.monitoring import router as monitoring_router
from app.api.v1.users import router as users_router
from app.database.session import engine, mongo_db
from app.database.base import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Postgres tables for initial setup, connect MongoDB
    import os
    os.makedirs("app/static/uploads", exist_ok=True)
    try:
        async with engine.begin() as conn:
            # For initial development setup, we can automatically create database tables.
            # In a full production CI/CD process, we would run Alembic migrations.
            await conn.run_sync(Base.metadata.create_all)
        
        # Auto-seed default credentials if the database has no registered users
        from app.database.session import async_session_maker
        from app.domain.models.user import User, UserRole
        from app.core.security import get_password_hash
        from sqlalchemy.future import select
        
        async with async_session_maker() as db:
            res = await db.execute(select(User).limit(1))
            if not res.scalars().first():
                print("No user credentials found. Seeding default user credentials automatically...")
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
                print("Default user credentials seeded successfully: researcher@wildlife.gov, officer@wildlife.gov, admin@wildlife.gov (password: password123)")
    except Exception as e:
        print(f"Warning: PostgreSQL database setup could not be completed automatically. Error: {e}")
        
    # MongoDB is optional if local setup is unavailable
    try:
        mongo_db.connect()
    except Exception as e:
        print(f"Warning: MongoDB connection could not be established. Running without MongoDB. Error: {e}")
    yield
    # Shutdown: Close connections
    try:
        mongo_db.close()
    except Exception:
        pass



app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Mount Static Files
from fastapi.staticfiles import StaticFiles
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Include Routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(survey_router, prefix=settings.API_V1_STR, tags=["survey"])
app.include_router(reports_router, prefix=f"{settings.API_V1_STR}/reports", tags=["reports"])
app.include_router(alerts_router, prefix=f"{settings.API_V1_STR}/alerts", tags=["alerts"])
app.include_router(analytics_router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
app.include_router(monitoring_router, prefix=f"{settings.API_V1_STR}/monitoring", tags=["monitoring"])
app.include_router(users_router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])



@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs": "/docs",
    }
