"""
Solar ERP — Application Configuration
Centralized settings using Pydantic Settings.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "Solar ERP"
    app_version: str = "1.0.0"
    debug: bool = True

    # Database
    database_url: str = "postgresql+asyncpg://solar_admin:solar_secret_2024@localhost:5432/solar_erp"

    # Security
    secret_key: str = "super-secret-key-change-in-production"
    access_token_expire_minutes: int = 480  # 8 hours
    algorithm: str = "HS256"

    # CORS
    cors_origins: List[str] = ["http://localhost:3000"]

    # S3 Storage
    s3_endpoint: str = ""
    s3_access_key: str = ""
    s3_secret_key: str = ""
    s3_bucket: str = "solar-erp-photos"

    # AI (Anthropic Claude)
    anthropic_api_key: str = ""

    # WhatsApp
    whatsapp_api_url: str = ""
    whatsapp_api_token: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
