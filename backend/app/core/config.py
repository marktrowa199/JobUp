from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = Field(default="JobUp")
    environment: str = Field(default="development")
    database_url: str = Field(default="sqlite:///./jobup_dev.db")
    allowed_origins: List[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )
    job_api_key: str = Field(default="")
    job_api_app_id: str = Field(default="")
    job_api_base_url: str = Field(default="")
    job_api_provider: str = Field(default="adzuna")

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
