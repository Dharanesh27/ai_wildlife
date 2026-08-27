from datetime import datetime
from uuid import UUID
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from app.domain.models.survey import DeviceType, DeviceStatus, ObservationType, ThreatLevel, RecommendationPriority, RecommendationStatus


# --- SURVEY SITE SCHEMAS ---
class SurveySiteBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    location_name: str
    latitude: float
    longitude: float
    habitat_type: str
    is_protected_area: bool = True


class SurveySiteCreate(SurveySiteBase):
    pass


class SurveySiteUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    habitat_type: Optional[str] = None
    is_protected_area: Optional[bool] = None


class SurveySiteOut(SurveySiteBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- DEVICE SCHEMAS ---
class DeviceBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    device_type: DeviceType = DeviceType.CAMERA_TRAP
    status: DeviceStatus = DeviceStatus.ACTIVE
    battery_level: float = 100.0
    latitude: float
    longitude: float
    site_id: UUID


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    device_type: Optional[DeviceType] = None
    status: Optional[DeviceStatus] = None
    battery_level: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    site_id: Optional[UUID] = None


class DeviceOut(DeviceBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- OBSERVATION SCHEMAS ---
class ObservationBase(BaseModel):
    device_id: UUID
    observation_type: ObservationType
    file_url: Optional[str] = None
    detected_species: str
    taxonomic_class: str
    confidence: float
    count: int = 1
    behavior: Optional[str] = None
    bounding_box: Optional[Any] = None
    health_index: Optional[float] = None
    threat_level: ThreatLevel = ThreatLevel.NONE
    threat_details: Optional[str] = None


class ObservationCreate(ObservationBase):
    pass


class ObservationOut(ObservationBase):
    id: UUID
    timestamp: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# --- ECOSYSTEM HEALTH LOG SCHEMAS ---
class EcosystemHealthLogBase(BaseModel):
    site_id: UUID
    biodiversity_score: float
    habitat_quality_score: float
    population_stability_score: float
    endangered_species_status_score: float
    environmental_conditions_score: float
    overall_health_score: float


class EcosystemHealthLogCreate(EcosystemHealthLogBase):
    pass


class EcosystemHealthLogOut(EcosystemHealthLogBase):
    id: UUID
    logged_at: datetime

    class Config:
        from_attributes = True


# --- RECOMMENDATION SCHEMAS ---
class RecommendationBase(BaseModel):
    site_id: UUID
    title: str
    description: str
    priority: RecommendationPriority = RecommendationPriority.ROUTINE
    status: RecommendationStatus = RecommendationStatus.OPEN


class RecommendationCreate(RecommendationBase):
    pass


class RecommendationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[RecommendationPriority] = None
    status: Optional[RecommendationStatus] = None
    resolved_at: Optional[datetime] = None


class RecommendationOut(RecommendationBase):
    id: UUID
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True
