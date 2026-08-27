import os
from celery import Celery
from app.core.config import settings

# Initialize Celery
# Fallback to redis://localhost:6379/0 if settings do not define REDIS_URL
redis_url = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "wildlife_tasks",
    broker=redis_url,
    backend=redis_url,
    include=["app.core.tasks"]
)

# Optional configurations
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300, # 5 minutes maximum runtime
)
