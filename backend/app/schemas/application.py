from datetime import date, datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator


class ApplicationStatus(str, Enum):
    APPLICATIONS_SUBMITTED = "Applications Submitted"
    IN_PROGRESS = "In Progress"
    INTERVIEW = "Interview"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"


class NextAction(str, Enum):
    PREPARE_INTERVIEW = "Prepare Interview"
    WAITING = "Waiting"
    FOLLOW_UP = "Follow Up"
    SEND_EMAIL = "Send Email"
    DECIDE = "Decide"


def clean_optional(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


def clean_http_url(value: Any) -> Any:
    value = clean_optional(value)
    if isinstance(value, str) and "://" not in value:
        return f"https://{value}"
    return value


class ApplicationCreate(BaseModel):
    job_id: str | None = Field(default=None, min_length=1, max_length=512)
    title: str = Field(..., min_length=1, max_length=250)
    company: str = Field(..., min_length=1, max_length=250)
    location: str | None = Field(default=None, max_length=250)
    url: HttpUrl | None = Field(default=None, max_length=2048)
    status: ApplicationStatus = ApplicationStatus.APPLICATIONS_SUBMITTED
    next_action: NextAction | None = None
    application_date: date | None = None
    salary: str | None = Field(default=None, max_length=250)
    company_website: HttpUrl | None = Field(default=None, max_length=2048)
    contact_person: str | None = Field(default=None, max_length=200)
    contact_information: str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=5000)
    allow_duplicate: bool = False

    @field_validator("title", "company")
    @classmethod
    def required_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("This field is required.")
        return normalized

    @field_validator("location", "salary", "contact_person", "contact_information", "notes", mode="before")
    @classmethod
    def trim_optional_text(cls, value: Any) -> Any:
        return clean_optional(value)

    @field_validator("url", "company_website", mode="before")
    @classmethod
    def normalize_url(cls, value: Any) -> Any:
        return clean_http_url(value)


class ApplicationUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=250)
    company: str | None = Field(default=None, min_length=1, max_length=250)
    location: str | None = Field(default=None, max_length=250)
    url: HttpUrl | None = Field(default=None, max_length=2048)
    status: ApplicationStatus | None = None
    next_action: NextAction | None = None
    application_date: date | None = None
    salary: str | None = Field(default=None, max_length=250)
    company_website: HttpUrl | None = Field(default=None, max_length=2048)
    contact_person: str | None = Field(default=None, max_length=200)
    contact_information: str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=5000)

    @field_validator("title", "company")
    @classmethod
    def required_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("This field is required.")
        return normalized

    @field_validator("location", "salary", "contact_person", "contact_information", "notes", mode="before")
    @classmethod
    def trim_optional_text(cls, value: Any) -> Any:
        return clean_optional(value)

    @field_validator("url", "company_website", mode="before")
    @classmethod
    def normalize_url(cls, value: Any) -> Any:
        return clean_http_url(value)

    @model_validator(mode="after")
    def require_update_value(self):
        if not self.model_fields_set:
            raise ValueError("At least one application field must be provided.")
        if any(field in self.model_fields_set and getattr(self, field) is None for field in ("title", "company")):
            raise ValueError("Company and job title cannot be empty.")
        return self


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: str
    title: str
    company: str
    location: str
    url: str
    status: ApplicationStatus
    next_action: NextAction | None
    applied_at: datetime
    salary: str | None
    company_website: str | None
    contact_person: str | None
    contact_information: str | None
    notes: str | None
