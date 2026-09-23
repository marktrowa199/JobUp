from datetime import datetime
from typing import Any
from urllib.parse import urlparse

import httpx

from app.core.config import settings


def _normalize_remote(raw: Any) -> str:
    if raw is None:
        return "Not specified"
    if isinstance(raw, bool):
        return "Remote" if raw else "On-site"
    value = str(raw).strip()
    return value if value else "Not specified"


def _normalize_salary(raw: Any) -> str:
    if raw is None:
        return "Salary not specified"
    if isinstance(raw, dict):
        value = raw.get("from") or raw.get("to") or raw.get("currency")
        if value is not None:
            return str(value)
    return str(raw).strip() or "Salary not specified"


def _normalize_date(raw: Any) -> str:
    if raw is None:
        return "Posted recently"
    if isinstance(raw, (int, float)):
        try:
            return datetime.fromtimestamp(int(raw)).strftime("%Y-%m-%d")
        except (TypeError, ValueError):
            return "Posted recently"
    if isinstance(raw, str):
        return raw
    return "Posted recently"


def _provider_name() -> str:
    return settings.job_api_provider.strip().capitalize() or "Job Provider"


def _normalize_company(raw: Any) -> dict[str, Any]:
    if isinstance(raw, dict):
        return {
            "name": raw.get("display_name") or raw.get("name") or "Not specified",
            "description": raw.get("description"),
            "website": raw.get("website") or raw.get("url"),
            "industry": raw.get("industry") or raw.get("label"),
        }
    return {
        "name": str(raw).strip() if raw else "Not specified",
        "description": None,
        "website": None,
        "industry": None,
    }


def _normalize_job(item: dict[str, Any], provider: str) -> dict[str, Any]:
    company = _normalize_company(item.get("company"))
    location = item.get("location")
    if isinstance(location, dict):
        location = location.get("display_name") or location.get("area")

    category = item.get("category")
    if isinstance(category, dict):
        category = category.get("label")

    return {
        "id": str(item.get("id") or item.get("job_id") or ""),
        "title": item.get("title") or "Not specified",
        "company": company["name"],
        "company_details": company,
        "location": location or item.get("location_name") or "Not specified",
        "description": item.get("description") or item.get("snippet") or "No description available.",
        "salary": _normalize_salary(item.get("salary") or item.get("salary_min")),
        "job_type": item.get("contract_type") or item.get("employment_type") or "Not specified",
        "remote": _normalize_remote(item.get("remote") or item.get("remote_work") or item.get("work_from_home")),
        "posted_date": _normalize_date(item.get("created") or item.get("published") or item.get("date")),
        "source": provider,
        "url": item.get("redirect_url") or item.get("url") or "",
        "industry": category,
    }


def _details_url(job_id: str) -> str:
    parsed = urlparse(settings.job_api_base_url)
    path_parts = [part for part in parsed.path.split("/") if part]
    if "search" in path_parts:
        path_parts[path_parts.index("search")] = "details"
        path_parts = path_parts[: path_parts.index("details") + 1] + [job_id]
    else:
        path_parts.extend(["details", job_id])
    return parsed._replace(path="/" + "/".join(path_parts), query="").geturl()


async def search_jobs(keyword: str, location: str, page: int, limit: int, job_type: str, remote: str) -> dict[str, Any]:
    api_key = settings.job_api_key
    base_url = settings.job_api_base_url

    if not api_key or not base_url:
        raise RuntimeError("Job search provider is not configured.")

    params: dict[str, Any] = {
        "app_id": settings.job_api_app_id or "",
        "app_key": api_key,
        "results_per_page": limit,
        "page": page,
        "what": keyword,
        "where": location,
    }

    if job_type:
        params["full_time"] = "1" if job_type.lower() == "full time" else None
    if remote:
        params["remote_only"] = "1" if remote.lower() == "remote" else None

    filtered_params = {key: value for key, value in params.items() if value not in (None, "", False)}

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(base_url, params=filtered_params)
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPError as exc:
        raise RuntimeError(f"External job API request failed: {exc}") from exc

    results = payload.get("results") or payload.get("jobs") or []
    normalized_jobs: list[dict[str, Any]] = []

    provider = _provider_name()
    for item in results:
        normalized = _normalize_job(item, provider)
        if normalized["id"]:
            normalized_jobs.append(normalized)

    return {
        "keyword": keyword,
        "location": location,
        "page": page,
        "limit": limit,
        "total": len(normalized_jobs),
        "jobs": normalized_jobs,
        "source": "external",
        "message": "Jobs fetched successfully.",
    }


async def get_job(job_id: str) -> dict[str, Any]:
    api_key = settings.job_api_key
    base_url = settings.job_api_base_url
    if not api_key or not base_url:
        raise RuntimeError("Job search provider is not configured.")

    params = {
        "app_id": settings.job_api_app_id or "",
        "app_key": api_key,
    }
    filtered_params = {key: value for key, value in params.items() if value}

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(_details_url(job_id), params=filtered_params)
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            raise LookupError("Job listing was not found.") from exc
        raise RuntimeError("External job API request failed.") from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise RuntimeError("External job API request failed.") from exc

    payload.setdefault("id", job_id)
    return _normalize_job(payload, _provider_name())
