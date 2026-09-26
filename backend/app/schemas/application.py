from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class ApplicationStatus(str, Enum):
    IN_PROGRESS = "In Progress"
    SUBMITTED = "Submitted"
    INTERVIEW = "Interview"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"


class ApplicationCreate(BaseModel):
    job_id: str = Field(..., min_length=1, max_length=512)
    title: str = Field(..., min_length=1, max_length=250)
    company: str = Field(..., min_length=1, max_length=250)
    location: str = Field(..., min_length=1, max_length=250)
    url: HttpUrl


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: str
    title: str
    company: str
    location: str
    url: str
    status: ApplicationStatus
    applied_at: datetime