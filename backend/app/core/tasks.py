import asyncio
import os
from uuid import UUID
from celery import Celery
from app.core.celery_app import celery_app
from app.database.session import async_session_maker
from app.repositories.survey_repo import ObservationRepository, DeviceRepository, RecommendationRepository
from app.domain.schemas.survey import ObservationCreate, RecommendationCreate
from app.domain.models.survey import ThreatLevel, RecommendationStatus, ObservationType
from app.core.taxonomy import TaxonomicLookupService
from app.core.notifications import trigger_telemetry_alert

# Import inference functions directly
from app.core.inference import analyze_image
from app.core.audio_inference import analyze_audio

async def async_process_telemetry(device_id_str: str, file_url: str, file_path: str, obs_type: str) -> dict:
    device_id = UUID(device_id_str)
    
    # 1. Run inference depending on type
    if obs_type == "audio":
        metrics = analyze_audio(file_path)
        obs_enum = ObservationType.AUDIO
    else:
        # For image, we need to generate the annotated bounding-box image at the expected static path
        filename = os.path.basename(file_path)
        annotated_filename = f"annotated_{filename}"
        upload_dir = os.path.dirname(file_path)
        annotated_path = os.path.join(upload_dir, annotated_filename)
        
        metrics = analyze_image(file_path, annotated_path)
        obs_enum = ObservationType.IMAGE
        
    # 2. Query GBIF taxonomic registry & enrich
    tax_info = await TaxonomicLookupService.fetch_details(metrics["detected"])
    
    iucn_tag = f"[IUCN: {tax_info['iucn_code']}]"
    enriched_threat_details = metrics["threat_details"]
    if enriched_threat_details:
        enriched_threat_details = f"{iucn_tag} {enriched_threat_details}"
    else:
        enriched_threat_details = f"{iucn_tag} Sighting recorded."
        
    # Translate threat level string to enum
    threat_map = {
        "Critical": ThreatLevel.CRITICAL,
        "High": ThreatLevel.HIGH,
        "Medium": ThreatLevel.MEDIUM,
        "None": ThreatLevel.NONE
    }
    parsed_threat = threat_map.get(metrics["threat_level"], ThreatLevel.NONE)
    
    # 3. Save to database using isolated SQLAlchemy connection
    async with async_session_maker() as session:
        device_repo = DeviceRepository(session)
        observation_repo = ObservationRepository(session)
        rec_repo = RecommendationRepository(session)
        
        device = await device_repo.get(device_id)
        if not device:
            raise ValueError("Device not found")
            
        obs_in = ObservationCreate(
            device_id=device_id,
            observation_type=obs_enum,
            file_url=file_url,
            detected_species=metrics["detected"],
            taxonomic_class=tax_info["lineage"],
            confidence=metrics["confidence"],
            count=metrics["count"],
            behavior=metrics["behavior"],
            bounding_box=metrics["box"],
            health_index=metrics["health_index"],
            threat_level=parsed_threat,
            threat_details=enriched_threat_details
        )
        observation = await observation_repo.create(obj_in=obs_in)
        
        # 4. Trigger Alerts and patrol recommendations
        if parsed_threat in [ThreatLevel.HIGH, ThreatLevel.CRITICAL]:
            rec_priority = "Critical" if parsed_threat == ThreatLevel.CRITICAL else "Medium"
            rec_title = f"Alert: {parsed_threat.value} threat at {device.name}"
            rec_desc = (
                f"Sensor alarm: {enriched_threat_details}. "
                f"Specimen: {metrics['detected']} (Confidence: {metrics['confidence']}%). "
                f"Patrol deployment is recommended immediately in Sector {device.name}."
            )
            
            await rec_repo.create(
                obj_in=RecommendationCreate(
                    site_id=device.site_id,
                    title=rec_title,
                    description=rec_desc,
                    priority=rec_priority,
                    status=RecommendationStatus.OPEN,
                )
            )
            
            await trigger_telemetry_alert(
                alert_type="Security",
                title=f"Intruder Alert: {parsed_threat.value} Threat",
                message=f"Threat detected at station '{device.name}': {enriched_threat_details}. Detected Specimen: {metrics['detected']}.",
                severity=parsed_threat.value
            )
            
        # 5. Device battery drainage
        new_battery = device.battery_level
        if device.battery_level > 5.0:
            new_battery = max(0.0, device.battery_level - 0.2)
            await device_repo.update(db_obj=device, obj_in={"battery_level": new_battery})
            
        if new_battery < 15.0:
            await trigger_telemetry_alert(
                alert_type="Hardware",
                title=f"Low Battery Warning: {device.name}",
                message=f"Station '{device.name}' battery level is critically low ({new_battery:.1f}%). Maintenance required.",
                severity="Warning"
            )
            
        await session.commit()
        
    return {
        "id": str(observation.id),
        "detected": metrics["detected"],
        "confidence": metrics["confidence"],
        "count": metrics["count"],
        "behavior": metrics["behavior"],
        "health_index": f"{metrics['health_index']}/10",
        "threat_level": metrics["threat_level"],
        "threat_details": enriched_threat_details,
        "taxonomic_class": tax_info["lineage"],
        "box": metrics["box"],
        "file_url": file_url
    }

@celery_app.task
def process_telemetry_task(device_id_str: str, file_url: str, file_path: str, obs_type: str) -> dict:
    """Queued Celery background task processing image or audio telemetry feeds."""
    return asyncio.run(async_process_telemetry(device_id_str, file_url, file_path, obs_type))
