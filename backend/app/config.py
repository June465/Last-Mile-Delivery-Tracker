import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Last-Mile Delivery Tracker"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "SUPER_SECRET_KEY_CHANGE_IN_PRODUCTION_123456789"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database Settings - default to SQLite file database for zero-config local setup
    DATABASE_URL: str = "sqlite:///./delivery_tracker.db"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
