import os
from typing import List, Union
from pydantic import AnyHttpUrl, BeforeValidator, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Annotated


def parse_cors_origins(v: Union[str, List[str]]) -> List[str]:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, (list, str)):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_ignore_empty=True, extra="ignore"
    )

    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AI Wildlife Population Intelligence System"
    
    # Security Settings
    SECRET_KEY: str = "SUPER_SECRET_REPLACE_ME_IN_PRODUCTION_JWT_SECRET_KEY_12345678"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 Days for development convenience
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: Annotated[
        List[str], BeforeValidator(parse_cors_origins)
    ] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Postgres Configuration
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "ai_wildlife"
    POSTGRES_PORT: int = 5432

    @property
    def async_database_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # MongoDB Configuration
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "ai_wildlife_media"

    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    @property
    def redis_url(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"


settings = Settings()
