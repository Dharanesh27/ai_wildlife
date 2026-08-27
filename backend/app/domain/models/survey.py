import uuid
from enum import Enum
from sqlalchemy import Boolean, Column, String, Float, Integer, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base


class DeviceType(str, Enum):
    CAMERA_TRAP = "Camera Trap"
    AUDIO_SENSOR = "Audio Sensor"


class DeviceStatus(str, Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    MAINTENANCE = "Maintenance"


class ObservationType(str, Enum):
    IMAGE = "Image"
    AUDIO = "Audio"


class ThreatLevel(str, Enum):
    NONE = "None"
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class RecommendationPriority(str, Enum):
    ROUTINE = "Routine"
    MEDIUM = "Medium"
    CRITICAL = "Critical"


class RecommendationStatus(str, Enum):
    OPEN = "Open"
    ACKNOWLEDGED = "Acknowledged"
    RESOLVED = "Resolved"


class SurveySite(Base):
    __tablename__ = "survey_sites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    location_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    habitat_type = Column(String, nullable=False)  # Forest, Wetland, Grassland, etc.
    is_protected_area = Column(Boolean(), default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    devices = relationship("Device", back_populates="site", cascade="all, delete-orphan")
    health_logs = relationship("EcosystemHealthLog", back_populates="site", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="site", cascade="all, delete-orphan")


class Device(Base):
    __tablename__ = "devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, index=True, nullable=False)
    device_type = Column(SQLEnum(DeviceType), nullable=False, default=DeviceType.CAMERA_TRAP)
    status = Column(SQLEnum(DeviceStatus), nullable=False, default=DeviceStatus.ACTIVE)
    battery_level = Column(Float, default=100.0)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    site_id = Column(UUID(as_uuid=True), ForeignKey("survey_sites.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    site = relationship("SurveySite", back_populates="devices")
    observations = relationship("Observation", back_populates="device", cascade="all, delete-orphan")


class Observation(Base):
    __tablename__ = "observations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    observation_type = Column(SQLEnum(ObservationType), nullable=False)
    file_url = Column(String, nullable=True)
    detected_species = Column(String, nullable=False, index=True)
    taxonomic_class = Column(String, nullable=False, index=True)
    confidence = Column(Float, nullable=False)  # percentage, e.g. 96.8
    count = Column(Integer, default=1)
    behavior = Column(String, nullable=True)
    bounding_box = Column(JSON, nullable=True)  # List of coordinates [x, y, w, h] or boxes
    health_index = Column(Float, nullable=True)  # 0 to 10 scale
    threat_level = Column(SQLEnum(ThreatLevel), default=ThreatLevel.NONE, nullable=False)
    threat_details = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    device = relationship("Device", back_populates="observations")


class EcosystemHealthLog(Base):
    __tablename__ = "ecosystem_health_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    site_id = Column(UUID(as_uuid=True), ForeignKey("survey_sites.id", ondelete="CASCADE"), nullable=False)
    biodiversity_score = Column(Float, nullable=False)
    habitat_quality_score = Column(Float, nullable=False)
    population_stability_score = Column(Float, nullable=False)
    endangered_species_status_score = Column(Float, nullable=False)
    environmental_conditions_score = Column(Float, nullable=False)
    overall_health_score = Column(Float, nullable=False)
    logged_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    site = relationship("SurveySite", back_populates="health_logs")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    site_id = Column(UUID(as_uuid=True), ForeignKey("survey_sites.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    priority = Column(SQLEnum(RecommendationPriority), default=RecommendationPriority.ROUTINE, nullable=False)
    status = Column(SQLEnum(RecommendationStatus), default=RecommendationStatus.OPEN, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    site = relationship("SurveySite", back_populates="recommendations")
