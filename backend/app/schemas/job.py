from pydantic import BaseModel, Field


class JobAnalysisRequest(BaseModel):
    title: str = Field(..., min_length=2, description="Job title")
    company: str = Field(..., min_length=2, description="Company name")
    description: str = Field(..., min_length=30, description="Detailed job description")


class JobAnalysisResponse(BaseModel):
    title: str
    company: str
    status: str
    detected_skills: list[str]
    message: str


class JobSearchQuery(BaseModel):
    keyword: str = Field(default="", description="Job keyword or title")
    location: str = Field(default="", description="Location to search")
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=10, ge=1, le=20)
    job_type: str = Field(default="", description="Optional job type filter")
    remote: str = Field(default="", description="Optional remote filter")


class JobSearchResultItem(BaseModel):
    id: str
    title: str
    company: str
    location: str
    description: str
    salary: str
    job_type: str
    remote: str
    posted_date: str
    source: str
    url: str


class JobCompany(BaseModel):
    name: str
    description: str | None = None
    website: str | None = None
    industry: str | None = None


class JobDetailsResponse(BaseModel):
    id: str
    title: str
    company: JobCompany
    location: str
    description: str
    salary: str
    job_type: str
    remote: str
    posted_date: str
    source: str
    url: str


class JobSearchResponse(BaseModel):
    keyword: str
    location: str
    page: int
    limit: int
    total: int
    jobs: list[JobSearchResultItem]
