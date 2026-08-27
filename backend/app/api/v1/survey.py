from datetime import datetime, timezone
from typing import Any, List
from uuid import UUID
import os
import shutil
from fastapi import APIRouter, Depends, status, HTTPException, Response, UploadFile, File, Form
from app.api.dependencies import (
    get_current_user,
    get_survey_site_repository,
    get_device_repository,
    get_observation_repository,
    get_ecosystem_health_log_repository,
    get_recommendation_repository,
    RoleChecker,
)
from app.core.exceptions import CustomHTTPException, DuplicateResourceException
from app.domain.models.user import User, UserRole
from app.domain.models.survey import DeviceType, DeviceStatus, ObservationType, ThreatLevel, RecommendationPriority, RecommendationStatus
from app.domain.schemas.survey import (
    SurveySiteCreate,
    SurveySiteOut,
    SurveySiteUpdate,
    DeviceCreate,
    DeviceOut,
    DeviceUpdate,
    ObservationCreate,
    ObservationOut,
    EcosystemHealthLogOut,
    RecommendationOut,
    RecommendationUpdate,
)
from app.repositories.survey_repo import (
    SurveySiteRepository,
    DeviceRepository,
    ObservationRepository,
    EcosystemHealthLogRepository,
    RecommendationRepository,
)

router = APIRouter()

# Role checkers
allow_all_authenticated = Depends(get_current_user)
allow_officer_or_admin = Depends(RoleChecker([UserRole.ADMINISTRATOR, UserRole.CONSERVATION_OFFICER, UserRole.FOREST_DEPARTMENT_OFFICER]))
allow_admin_only = Depends(RoleChecker([UserRole.ADMINISTRATOR]))


# ==========================================
# SURVEY SITES ENDPOINTS
# ==========================================

@router.post("/sites", response_model=SurveySiteOut, status_code=status.HTTP_201_CREATED)
async def create_site(
    site_in: SurveySiteCreate,
    site_repo: SurveySiteRepository = Depends(get_survey_site_repository),
    current_user: User = allow_officer_or_admin,
) -> Any:
    """
    Create a new wildlife survey monitoring site (Officers and Administrators only).
    """
    existing_site = await site_repo.get_by_name(site_in.name)
    if existing_site:
        raise DuplicateResourceException("A survey site with this name already exists.")
    site = await site_repo.create(obj_in=site_in)
    return site


@router.get("/sites", response_model=List[SurveySiteOut])
async def list_sites(
    skip: int = 0,
    limit: int = 100,
    site_repo: SurveySiteRepository = Depends(get_survey_site_repository),
    current_user: User = allow_all_authenticated,
) -> Any:
    """
    Retrieve all wildlife survey monitoring sites.
    """
    return await site_repo.get_multi(skip=skip, limit=limit)


@router.get("/sites/{site_id}", response_model=SurveySiteOut)
async def get_site(
    site_id: UUID,
    site_repo: SurveySiteRepository = Depends(get_survey_site_repository),
    current_user: User = allow_all_authenticated,
) -> Any:
    """
    Get survey site details by ID.
    """
    site = await site_repo.get(site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Survey site not found")
    return site


@router.put("/sites/{site_id}", response_model=SurveySiteOut)
async def update_site(
    site_id: UUID,
    site_in: SurveySiteUpdate,
    site_repo: SurveySiteRepository = Depends(get_survey_site_repository),
    current_user: User = allow_officer_or_admin,
) -> Any:
    """
    Update survey site attributes (Officers and Admins only).
    """
    site = await site_repo.get(site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Survey site not found")
    return await site_repo.update(db_obj=site, obj_in=site_in)


@router.delete("/sites/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_site(
    site_id: UUID,
    site_repo: SurveySiteRepository = Depends(get_survey_site_repository),
    current_user: User = allow_admin_only,
):
    """
    Delete a survey site (Administrators only).
    """
    site = await site_repo.get(site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Survey site not found")
    await site_repo.remove(id=site_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ==========================================
# DEVICES ENDPOINTS
# ==========================================

@router.post("/devices", response_model=DeviceOut, status_code=status.HTTP_201_CREATED)
async def register_device(
    device_in: DeviceCreate,
    device_repo: DeviceRepository = Depends(get_device_repository),
    site_repo: SurveySiteRepository = Depends(get_survey_site_repository),
    current_user: User = allow_officer_or_admin,
) -> Any:
    """
    Register a new hardware device (Camera Trap / Audio Sensor) at a site.
    """
    site = await site_repo.get(device_in.site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Assigned survey site does not exist")
    return await device_repo.create(obj_in=device_in)


@router.get("/devices", response_model=List[DeviceOut])
async def list_devices(
    skip: int = 0,
    limit: int = 100,
    device_repo: DeviceRepository = Depends(get_device_repository),
    current_user: User = allow_all_authenticated,
) -> Any:
    """
    List all active monitoring devices.
    """
    return await device_repo.get_multi(skip=skip, limit=limit)


@router.get("/sites/{site_id}/devices", response_model=List[DeviceOut])
async def list_site_devices(
    site_id: UUID,
    device_repo: DeviceRepository = Depends(get_device_repository),
    current_user: User = allow_all_authenticated,
) -> Any:
    """
    List all monitoring devices deployed at a specific survey site.
    """
    return await device_repo.get_by_site(site_id)


@router.put("/devices/{device_id}", response_model=DeviceOut)
async def update_device(
    device_id: UUID,
    device_in: DeviceUpdate,
    device_repo: DeviceRepository = Depends(get_device_repository),
    current_user: User = allow_officer_or_admin,
) -> Any:
    """
    Update details/status of a deployed device.
    """
    device = await device_repo.get(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return await device_repo.update(db_obj=device, obj_in=device_in)


@router.delete("/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    device_id: UUID,
    device_repo: DeviceRepository = Depends(get_device_repository),
    current_user: User = allow_admin_only,
):
    """
    Delete / remove a device from service.
    """
    device = await device_repo.get(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    await device_repo.remove(id=device_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ==========================================
# OBSERVATIONS / AI INGESTION ENDPOINTS
# ==========================================

@router.post("/observations", response_model=ObservationOut, status_code=status.HTTP_201_CREATED)
async def create_observation(
    observation_in: ObservationCreate,
    observation_repo: ObservationRepository = Depends(get_observation_repository),
    device_repo: DeviceRepository = Depends(get_device_repository),
    rec_repo: RecommendationRepository = Depends(get_recommendation_repository),
    current_user: User = allow_all_authenticated,
) -> Any:
    """
    Ingest a new wildlife capture observation (runs mock AI classification logic and threat detection).
    """
    device = await device_repo.get(observation_in.device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Associated device does not exist")

    # Fetch lineage details from GBIF and enrich
    from app.core.taxonomy import TaxonomicLookupService
    tax_info = await TaxonomicLookupService.fetch_details(observation_in.detected_species)
    observation_in.taxonomic_class = tax_info["lineage"]
    
    iucn_tag = f"[IUCN: {tax_info['iucn_code']}]"
    if observation_in.threat_details:
        observation_in.threat_details = f"{iucn_tag} {observation_in.threat_details}"
    else:
        observation_in.threat_details = f"{iucn_tag} Sighting recorded."

    # Ingest observation
    observation = await observation_repo.create(obj_in=observation_in)

    # Automated Threat Rule Engine (AI Recommendations Generator)
    if observation.threat_level in [ThreatLevel.HIGH, ThreatLevel.CRITICAL]:
        # Generate automated alert/recommendation for forest ranger intervention
        rec_title = f"Alert: {observation.threat_level.value} threat at {device.name}"
        rec_desc = (
            f"Automated sensor alert: {observation.threat_details or 'Threat detected'}. "
            f"Specimen: {observation.detected_species} (Confidence: {observation.confidence}%). "
            f"Patrol deployment is recommended immediately in Sector {device.name}."
        )
        rec_priority = RecommendationPriority.CRITICAL if observation.threat_level == ThreatLevel.CRITICAL else RecommendationPriority.MEDIUM
        
        # Add recommendation
        from app.domain.schemas.survey import RecommendationCreate
        await rec_repo.create(
            obj_in=RecommendationCreate(
                site_id=device.site_id,
                title=rec_title,
                description=rec_desc,
                priority=rec_priority,
                status=RecommendationStatus.OPEN,
            )
        )

        # Trigger telemetry alert log
        from app.core.notifications import trigger_telemetry_alert
        await trigger_telemetry_alert(
            alert_type="Security",
            title=f"Intruder Alert: {observation.threat_level.value} Threat",
            message=f"Threat detected at station '{device.name}': {observation.threat_details or 'Unauthorized activity'}. Detected Specimen: {observation.detected_species}.",
            severity=observation.threat_level.value
        )

    # Keep device battery levels simulated
    new_battery = device.battery_level
    if device.battery_level > 5.0:
        new_battery = max(0.0, device.battery_level - 0.2)
        await device_repo.update(db_obj=device, obj_in={"battery_level": new_battery})

    # Trigger low battery hardware alert
    if new_battery < 15.0:
        from app.core.notifications import trigger_telemetry_alert
        await trigger_telemetry_alert(
            alert_type="Hardware",
            title=f"Low Battery Warning: {device.name}",
            message=f"Station '{device.name}' battery level is critically low ({new_battery:.1f}%). Maintenance required.",
            severity="Warning"
        )

    return observation


@router.post("/observations/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_observation(
    file: UploadFile = File(...),
    device_id: UUID = Form(...),
    timestamp: str = Form(None),
    device_repo: DeviceRepository = Depends(get_device_repository),
    current_user: User = allow_all_authenticated,
) -> Any:
    """
    Ingest a new wildlife capture observation by uploading a real image/audio file.
    Queues YOLOv8 or Bioacoustic analysis to Celery background workers.
    """
    import uuid
    import shutil
    import os

    # 1. Verify device exists
    device = await device_repo.get(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Associated device does not exist")

    # 2. Save uploaded file to app/static/uploads
    filename = f"{uuid.uuid4()}_{file.filename}"
    upload_dir = "app/static/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 3. Detect file type (Image vs Audio)
    is_audio = (file.content_type and file.content_type.startswith("audio/")) or \
               file.filename.lower().endswith((".wav", ".mp3", ".m4a", ".ogg", ".flac"))
               
    # Determine local serving URLs
    if is_audio:
        final_url = f"http://localhost:8000/static/uploads/{filename}"
    else:
        # Images are annotated dynamically by workers
        annotated_filename = f"annotated_{filename}"
        final_url = f"http://localhost:8000/static/uploads/{annotated_filename}"

    # 4. Trigger Celery task, falling back to synchronous execution if Redis is offline
    try:
        from app.core.tasks import process_telemetry_task
        task = process_telemetry_task.delay(
            str(device_id), 
            final_url, 
            file_path, 
            "audio" if is_audio else "image"
        )
        return {
            "task_id": task.id,
            "status": "Processing",
            "message": "Observation upload accepted. ML analysis queued in background.",
            "is_async": True
        }
    except Exception as e:
        print(f"Warning: Celery/Redis connection failed ({e}). Running telemetry task synchronously.")
        from app.core.tasks import async_process_telemetry
        result = await async_process_telemetry(
            str(device_id), 
            final_url, 
            file_path, 
            "audio" if is_audio else "image"
        )
        return {
            "task_id": "sync-fallback",
            "status": "SUCCESS",
            "message": "Telemetry processed synchronously (Redis offline).",
            "is_async": False,
            "result": result
        }


@router.get("/observations/tasks/{task_id}")
async def get_task_status(
    task_id: str,
    current_user: User = allow_all_authenticated,
) -> Any:
    """Retrieves status and results of a background Celery telemetry pipeline job."""
    if task_id == "sync-fallback":
        return {
            "status": "SUCCESS",
            "result": None # Result was already returned synchronously
        }
        
    from celery.result import AsyncResult
    from app.core.celery_app import celery_app
    
    try:
        result = AsyncResult(task_id, app=celery_app)
        if result.ready():
            if result.successful():
                return {
                    "status": "SUCCESS",
                    "result": result.result
                }
            else:
                return {
                    "status": "FAILURE",
                    "message": str(result.result)
                }
        return {
            "status": "PENDING"
        }
    except Exception as e:
        return {
            "status": "FAILURE",
            "message": f"Failed to check Celery task status: {e}"
        }


@router.get("/observations", response_model=List[ObservationOut])
async def list_observations(
    limit: int = 100,
    observation_repo: ObservationRepository = Depends(get_observation_repository),
    current_user: User = allow_all_authenticated,
) -> Any:
    """
    List recent observations across all monitoring stations.
    """
    return await observation_repo.get_recent(limit=limit)


@router.get("/sites/{site_id}/observations", response_model=List[ObservationOut])
async def list_site_observations(
    site_id: UUID,
    limit: int = 100,
    observation_repo: ObservationRepository = Depends(get_observation_repository),
    current_user: User = allow_all_authenticated,
) -> Any:
    """
    List observations recorded at a specific survey site.
    """
    return await observation_repo.get_by_site(site_id, limit=limit)


@router.get("/observations/species-stats")
async def get_species_stats(
    observation_repo: ObservationRepository = Depends(get_observation_repository),
    current_user: User = allow_all_authenticated,
) -> Any:
    """
    Get aggregate telemetry metrics: total sighting counts grouped by species.
    """
    return await observation_repo.get_species_counts()


# ==========================================
# ECOSYSTEM HEALTH & RECOMMENDATIONS ENDPOINTS
# ==========================================

@router.get("/sites/{site_id}/health-logs", response_model=List[EcosystemHealthLogOut])
async def get_site_health_logs(
    site_id: UUID,
    limit: int = 50,
    health_repo: EcosystemHealthLogRepository = Depends(get_ecosystem_health_log_repository),
    current_user: User = allow_all_authenticated,
) -> Any:
    """
    Get ecological health scoring history logs for a survey site.
    """
    return await health_repo.get_by_site(site_id, limit=limit)


@router.post("/sites/{site_id}/recalculate-health", response_model=EcosystemHealthLogOut)
async def recalculate_site_health(
    site_id: UUID,
    site_repo: SurveySiteRepository = Depends(get_survey_site_repository),
    observation_repo: ObservationRepository = Depends(get_observation_repository),
    health_repo: EcosystemHealthLogRepository = Depends(get_ecosystem_health_log_repository),
    current_user: User = allow_officer_or_admin,
) -> Any:
    """
    Calculate and log the latest Ecosystem Health Score based on the Weighted Scoring Model:
    30% Species Diversity + 25% Population Stability + 20% Habitat Quality + 15% Endangered Species Status + 10% Environmental Conditions.
    """
    site = await site_repo.get(site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Survey site not found")

    observations = await observation_repo.get_by_site(site_id, limit=1000)

    # 1. Species Diversity Score (30%)
    # Scale based on the number of unique species observed (max 10 points for 5+ species)
    unique_species = {obs.detected_species for obs in observations}
    biodiversity_score = min(10.0, len(unique_species) * 2.0)

    # 2. Population Stability Score (25%)
    # Default stable baseline, adjusted down if recent observations show high fluctuations
    population_stability_score = 8.5
    if len(observations) > 5:
        # Check variance in sightings count
        counts = [obs.count for obs in observations]
        mean_count = sum(counts) / len(counts)
        variance = sum((c - mean_count) ** 2 for c in counts) / len(counts)
        if variance > 4.0:
            population_stability_score = max(4.0, 8.5 - (variance * 0.5))

    # 3. Habitat Quality Score (20%)
    # Higher baseline for designated national reserves/protected areas
    habitat_quality_score = 9.0 if site.is_protected_area else 6.5

    # 4. Endangered Species Status (15%)
    # Elevates if target conservation species (Tigers, Elephants, Leopards) are observed in healthy configurations
    endangered_species_list = ["Bengal Tiger", "Asian Elephant", "Indian Leopard"]
    observed_endangered = unique_species.intersection(endangered_species_list)
    if observed_endangered:
        # Check health index of these observed endangered specimens
        endangered_obs = [obs for obs in observations if obs.detected_species in endangered_species_list]
        avg_health = sum(obs.health_index or 8.0 for obs in endangered_obs) / len(endangered_obs)
        endangered_species_status_score = min(10.0, avg_health + 0.5 * len(observed_endangered))
    else:
        endangered_species_status_score = 5.0  # low baseline since no critical indicator species observed

    # 5. Environmental Conditions (10%)
    # Deduct score for active threat incidents in recent logs
    environmental_conditions_score = 10.0
    recent_threats = [obs for obs in observations[:50] if obs.threat_level != ThreatLevel.NONE]
    for threat in recent_threats:
        if threat.threat_level == ThreatLevel.CRITICAL:
            environmental_conditions_score -= 3.0
        elif threat.threat_level == ThreatLevel.HIGH:
            environmental_conditions_score -= 1.5
        elif threat.threat_level == ThreatLevel.MEDIUM:
            environmental_conditions_score -= 0.5
    environmental_conditions_score = max(1.0, environmental_conditions_score)

    # Weighted Sum Formula
    overall_health_score = (
        0.30 * biodiversity_score +
        0.25 * population_stability_score +
        0.20 * habitat_quality_score +
        0.15 * endangered_species_status_score +
        0.10 * environmental_conditions_score
    )

    # Save to history log
    from app.domain.schemas.survey import EcosystemHealthLogCreate
    new_log = await health_repo.create(
        obj_in=EcosystemHealthLogCreate(
            site_id=site_id,
            biodiversity_score=round(biodiversity_score, 2),
            habitat_quality_score=round(habitat_quality_score, 2),
            population_stability_score=round(population_stability_score, 2),
            endangered_species_status_score=round(endangered_species_status_score, 2),
            environmental_conditions_score=round(environmental_conditions_score, 2),
            overall_health_score=round(overall_health_score, 2),
        )
    )
    return new_log


# ==========================================
# CONSERVATION RECOMMENDATIONS ENDPOINTS
# ==========================================

@router.get("/recommendations", response_model=List[RecommendationOut])
async def list_recommendations(
    active_only: bool = True,
    rec_repo: RecommendationRepository = Depends(get_recommendation_repository),
    current_user: User = allow_all_authenticated,
) -> Any:
    """
    Get active or all conservation recommendations.
    """
    if active_only:
        return await rec_repo.get_active()
    return await rec_repo.get_multi()


@router.get("/sites/{site_id}/recommendations", response_model=List[RecommendationOut])
async def list_site_recommendations(
    site_id: UUID,
    rec_repo: RecommendationRepository = Depends(get_recommendation_repository),
    current_user: User = allow_all_authenticated,
) -> Any:
    """
    Get conservation recommendations specific to a survey site.
    """
    return await rec_repo.get_by_site(site_id)


@router.put("/recommendations/{recommendation_id}", response_model=RecommendationOut)
async def update_recommendation(
    recommendation_id: UUID,
    rec_in: RecommendationUpdate,
    rec_repo: RecommendationRepository = Depends(get_recommendation_repository),
    current_user: User = allow_officer_or_admin,
) -> Any:
    """
    Update status / resolve a conservation recommendation patrol directive.
    """
    rec = await rec_repo.get(recommendation_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation directive not found")
    
    # If resolving, set timestamp
    if rec_in.status == RecommendationStatus.RESOLVED:
        rec_in.resolved_at = datetime.now(timezone.utc)

    return await rec_repo.update(db_obj=rec, obj_in=rec_in)


@router.post("/seed", status_code=status.HTTP_200_OK)
async def seed_database(
    current_user: User = allow_officer_or_admin,
):
    """
    Seed the database with sample survey sites, devices, and historical telemetry data.
    """
    from scripts.seed_db import seed
    try:
        await seed()
        return {"status": "success", "detail": "Database seeded successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to seed database: {e}")

