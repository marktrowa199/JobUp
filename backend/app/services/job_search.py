from datetime import datetime
from typing import Any

import httpx

from app.core.config import settings

_JOB_CACHE: dict[str, dict[str, Any]] = {}
_PAGE_TOKENS: dict[tuple[str, str, int], str] = {}
_MAX_CACHED_JOBS = 500


def _normalize_job(item: dict[str, Any], index: int) -> dict[str, Any]:
    extensions = item.get("extensions") or []
    detected = item.get("detected_extensions") or {}
    apply_options = item.get("apply_options") or []
    apply_url = next((option.get("link") for option in apply_options if option.get("link")), None)
    description = item.get("description") or "No description available."
    remote = detected.get("work_from_home") or any(
        term in f"{item.get('title', '')} {description}".lower()
        for term in ("remote", "work from home", "home-based")
    )
    identifier = str(item.get("job_id") or item.get("share_link") or f"serpapi-ph-{index}")
    try:
        posted = datetime.strptime(detected.get("posted_at", ""), "%Y-%m-%d").strftime("%Y-%m-%d")
    except (TypeError, ValueError):
        posted = detected.get("posted_at") or "Posted recently"
    job_type = detected.get("schedule_type") or next(
        (value for value in extensions if any(term in value.lower() for term in ("full-time", "part-time", "contract", "intern"))),
        "Not specified",
    )
    return {
        "id": identifier,
        "title": item.get("title") or "Not specified",
        "company": item.get("company_name") or "Not specified",
        "company_details": {"name": item.get("company_name") or "Not specified", "description": None, "website": None, "industry": None},
        "location": item.get("location") or "Philippines",
        "description": description,
        "salary": detected.get("salary") or "Salary not specified",
        "job_type": job_type,
        "remote": "Remote" if remote else "Not specified",
        "posted_date": posted,
        "source": "Google Jobs",
        "url": apply_url or item.get("share_link") or "",
        "industry": None,
    }


async def search_jobs(keyword: str, location: str, page: int, limit: int, job_type: str) -> dict[str, Any]:
    api_key = settings.serpapi_api_key.strip()
    if not api_key:
        raise RuntimeError("Job search provider is not configured.")
    normalized_location = location.strip() or "Philippines"
    remote_search = normalized_location.lower() in {"remote", "remote / philippines", "remote/philippines"}
    if remote_search:
        keyword = f"remote {keyword}"
        normalized_location = "Philippines"
    elif "philippines" not in normalized_location.lower() and "pilipinas" not in normalized_location.lower():
        normalized_location = f"{normalized_location}, Philippines"

    token_key = (keyword.lower(), normalized_location.lower(), page)
    params: dict[str, str] = {
        "engine": "google_jobs",
        "api_key": api_key,
        "q": keyword,
        "location": normalized_location,
        "gl": "ph",
        "hl": "en",
    }
    if page > 1:
        page_token = _PAGE_TOKENS.get(token_key)
        if not page_token:
            raise RuntimeError("No cursor is available for the requested page. Search from the first page again.")
        params["next_page_token"] = page_token

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get("https://serpapi.com/search.json", params=params)
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        message = str(exc).replace(api_key, "[redacted]")
        raise RuntimeError(f"External job API request failed: {message}") from None

    if not isinstance(payload, dict) or not isinstance(payload.get("jobs_results"), list) or payload.get("error"):
        raise RuntimeError("External job API returned an invalid response.")

    jobs: list[dict[str, Any]] = []
    for index, item in enumerate(payload["jobs_results"]):
        if not isinstance(item, dict):
            continue
        normalized = _normalize_job(item, index)
        jobs.append(normalized)
        _JOB_CACHE[normalized["id"]] = normalized

    next_token = (payload.get("serpapi_pagination") or {}).get("next_page_token")
    next_page = (keyword.lower(), normalized_location.lower(), page + 1)
    if next_token:
        _PAGE_TOKENS[next_page] = next_token
    else:
        _PAGE_TOKENS.pop(next_page, None)
    while len(_JOB_CACHE) > _MAX_CACHED_JOBS:
        _JOB_CACHE.pop(next(iter(_JOB_CACHE)))

    if job_type:
        jobs = [job for job in jobs if job_type.lower() in job["job_type"].lower()]
    return {
        "keyword": keyword,
        "location": normalized_location,
        "page": page,
        "limit": limit,
        "total": len(jobs),
        "jobs": jobs[:limit],
        "source": "external",
        "message": "Jobs fetched successfully.",
    }


async def get_job(job_id: str) -> dict[str, Any]:
    job = _JOB_CACHE.get(job_id)
    if job is None:
        raise LookupError("Job listing was not found in the recent search results.")
    return job
