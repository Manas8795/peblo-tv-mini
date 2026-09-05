import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Peblo TV Mini API"
    ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Database: Supports Postgres or SQLite fallback for zero-dependency local testing
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./peblo_tv.db"
    )

    # Storage backend: "local" or "r2"
    STORAGE_BACKEND: str = os.getenv("STORAGE_BACKEND", "local")
    LOCAL_STORAGE_PATH: str = os.getenv(
        "LOCAL_STORAGE_PATH",
        str(Path(__file__).resolve().parents[3] / "storage")
    )

    # Cloudflare R2 / S3 Configuration
    R2_ACCOUNT_ID: str = os.getenv("R2_ACCOUNT_ID", "")
    R2_ACCESS_KEY_ID: str = os.getenv("R2_ACCESS_KEY_ID", "")
    R2_SECRET_ACCESS_KEY: str = os.getenv("R2_SECRET_ACCESS_KEY", "")
    R2_BUCKET_NAME: str = os.getenv("R2_BUCKET_NAME", "peblo-tv-mini")
    R2_ENDPOINT_URL: str = os.getenv("R2_ENDPOINT_URL", "")

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "*"
    ]

    # Auth roles & tokens (for straightforward header/token or API key based auth)
    ADMIN_API_KEY: str = os.getenv("ADMIN_API_KEY", "admin-secret-key-peblo")
    EDITOR_API_KEY: str = os.getenv("EDITOR_API_KEY", "editor-secret-key-peblo")

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()
