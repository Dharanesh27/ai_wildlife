from uuid import UUID
from fastapi import APIRouter, Depends, status, HTTPException
from app.api.dependencies import (
    get_current_user,
    get_survey_site_repository,
    get_observation_repository,
)
from app.domain.models.user import User
from app.repositories.survey_repo import SurveySiteRepository, ObservationRepository
from app.core.forecasting import PopulationForecaster

router = APIRouter()

# Authenticated users only
allow_all_authenticated = Depends(get_current_user)

@router.get("/forecast/{site_id}")
async def get_population_forecast(
    site_id: UUID,
    site_repo: SurveySiteRepository = Depends(get_survey_site_repository),
    observation_repo: ObservationRepository = Depends(get_observation_repository),
    current_user: User = allow_all_authenticated,
):
    """Retrieves dynamic historical sightings data and returns 3-month predictive population forecasts."""
    # 1. Verify reserve site exists
    site = await site_repo.get(site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Survey reserve site not found")

    # 2. Fetch observations
    # Pull up to 2000 observations to construct historical curve
    observations = await observation_repo.get_by_site(site_id, limit=2000)

    # 3. Generate forecast
    forecast = PopulationForecaster.generate_forecast(observations)
    
    # 4. Attach site context details
    forecast["site"] = {
        "id": str(site.id),
        "name": site.name,
        "location_name": site.location_name
    }
    
    return forecast
