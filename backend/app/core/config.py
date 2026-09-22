from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = Field(default="JobUp")
    environment: str = Field(default="development")
    database_url: str = Field(default="sqlite:///./jobup_dev.db")
    allowed_origins: List[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
