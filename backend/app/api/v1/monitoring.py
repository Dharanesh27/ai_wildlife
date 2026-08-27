from uuid import UUID
from fastapi import APIRouter, Depends, status, HTTPException
from app.api.dependencies import (
    get_current_user,
    get_survey_site_repository,
)
from app.domain.models.user import User
from app.repositories.survey_repo import SurveySiteRepository
from app.core.monitoring import HabitatMonitoringService
from app.core.notifications import IN_MEMORY_ALERTS
from app.database.session import get_mongo_db

router = APIRouter()

# Authenticated users only
allow_all_authenticated = Depends(get_current_user)

@router.get("/suitability/{site_id}")
async def get_site_suitability(
    site_id: UUID,
    site_repo: SurveySiteRepository = Depends(get_survey_site_repository),
    current_user: User = allow_all_authenticated,
):
    """Retrieves active alerts and returns dynamic HSI and NDVI suitability scores for a site."""
    # 1. Verify reserve site exists
    site = await site_repo.get(site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Survey reserve site not found")

    # 2. Retrieve active alerts for the site
    alerts = []
    
    # Try fetching from MongoDB
    try:
        mongo_db_inst = get_mongo_db()
        if mongo_db_inst is not None:
            cursor = mongo_db_inst.telemetry_alerts.find({"is_read": False})
            async for alert in cursor:
                # Format to dictionary
                alerts.append({
                    "alert_type": alert.get("alert_type"),
                    "is_read": alert.get("is_read", False)
                })
    except Exception as e:
        print(f"Warning: Failed to fetch alerts from MongoDB: {e}. Falling back to in-memory alerts.")
        
    # If MongoDB was offline or returned empty, check in-memory alerts
    if not alerts:
        for alert in IN_MEMORY_ALERTS:
            alerts.append({
                "alert_type": alert.get("alert_type"),
                "is_read": alert.get("is_read", False)
            })

    # 3. Calculate HSI and NDVI indices
    suitability = HabitatMonitoringService.calculate_suitability(
        site_id=site_id,
        site_name=site.name,
        active_alerts=alerts
    )
    
    return suitability
