from fastapi import APIRouter, HTTPException, Query

from app.schemas.job import (
    JobAnalysisRequest,
    JobAnalysisResponse,
    JobDetailsResponse,
    JobSearchResponse,
)
from app.services.job_analyzer import analyze_job_description
from app.services.job_search import get_job, search_jobs

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.post("/analyze", response_model=JobAnalysisResponse)
async def analyze_job(payload: JobAnalysisRequest) -> JobAnalysisResponse:
    try:
        result = analyze_job_description(payload.title, payload.company, payload.description)
        return JobAnalysisResponse(**result)
    except Exception as exc:  # pragma: no cover - defensive fallback
        raise HTTPException(
            status_code=500,
            detail="Unable to analyze the job description at the moment.",
        ) from exc


@router.get("/search", response_model=JobSearchResponse)
async def search_jobs_endpoint(
    keyword: str = Query(default="", min_length=0),
    location: str = Query(default="", min_length=0),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=20),
    job_type: str = Query(default=""),
    remote: str = Query(default=""),
) -> JobSearchResponse:
    try:
        result = await search_jobs(keyword, location, page, limit, job_type, remote)
        return JobSearchResponse(
            keyword=result.get("keyword", keyword),
            location=result.get("location", location),
            page=result.get("page", page),
            limit=result.get("limit", limit),
            total=result.get("total", 0),
            jobs=[
                {
                    "id": item["id"],
                    "title": item["title"],
                    "company": item["company"],
                    "location": item["location"],
                    "description": item["description"],
                    "salary": item["salary"],
                    "job_type": item["job_type"],
                    "remote": item["remote"],
                    "posted_date": item["posted_date"],
                    "source": item["source"],
                    "url": item["url"],
                }
                for item in result.get("jobs", [])
            ],
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="We couldn't load job listings right now. Please try again in a moment.",
        ) from exc


@router.get("/{job_id}", response_model=JobDetailsResponse)
async def get_job_endpoint(job_id: str) -> JobDetailsResponse:
    try:
        item = await get_job(job_id)
        company = item.get("company_details") or {"name": item.get("company", "Not specified")}
        return JobDetailsResponse(
            id=item["id"],
            title=item["title"],
            company=company,
            location=item["location"],
            description=item["description"],
            salary=item["salary"],
            job_type=item["job_type"],
            remote=item["remote"],
            posted_date=item["posted_date"],
            source=item["source"],
            url=item["url"],
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail="This job is no longer available.") from exc
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="We couldn't load this job right now. Please try again in a moment.",
        ) from exc
