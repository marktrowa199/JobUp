from collections import defaultdict, deque
from time import monotonic

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.applications import router as applications_router
from app.api.jobs import router as jobs_router
from app.api.routes.health import router as health_router
from app.core.config import settings
from app.database.database import init_db
from app.api.auth import router as auth_router

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="JobUp API for resume and job matching MVP",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)

_rate_windows: dict[tuple[str, str], deque[float]] = defaultdict(deque)
_RATE_RULES = {
    ("POST", "/api/auth/login"): (10, 15 * 60),
    ("POST", "/api/auth/register"): (5, 60 * 60),
    ("GET", "/api/jobs/search"): (30, 60),
    ("POST", "/api/jobs/analyze"): (20, 60),
}
_RATE_PERIODS = {f"{method}:{path}": period for (method, path), (_limit, period) in _RATE_RULES.items()}


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    origin = request.headers.get("origin")
    if request.method in {"POST", "PUT", "PATCH", "DELETE"} and origin and origin not in settings.allowed_origins:
        response = JSONResponse({"detail": "Request origin is not allowed."}, status_code=403)
    else:
        rule = _RATE_RULES.get((request.method, request.url.path))
        if rule:
            limit, period = rule
            forwarded_address = (
                request.headers.get("x-jobup-client-ip")
                if request.client and request.client.host in settings.trusted_proxy_ips
                else None
            )
            address = forwarded_address or (request.client.host if request.client else "unknown")
            key = (f"{request.method}:{request.url.path}", address[:128])
            now = monotonic()
            events = _rate_windows[key]
            while events and now - events[0] >= period:
                events.popleft()
            if not events:
                _rate_windows.pop(key, None)
                events = _rate_windows[key]
            if len(events) >= limit:
                response = JSONResponse({"detail": "Too many requests. Please try again later."}, status_code=429)
                response.headers["Retry-After"] = str(max(1, int(period - (now - events[0]))))
            else:
                events.append(now)
                response = await call_next(request)
        else:
            response = await call_next(request)

    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)")
    response.headers.setdefault("X-Frame-Options", "DENY")
    if request.url.path.startswith(("/api/auth", "/api/applications")):
        response.headers.setdefault("Cache-Control", "no-store")
    if len(_rate_windows) > 10_000:
        for key, events in list(_rate_windows.items()):
            period = _RATE_PERIODS.get(key[0], 0)
            if not events or (period and monotonic() - events[-1] >= period):
                _rate_windows.pop(key, None)
    return response


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_request: Request, _exc: RequestValidationError):
    # FastAPI's default validation response echoes submitted values, which can include passwords.
    return JSONResponse({"detail": "Invalid request data."}, status_code=422)

app.include_router(health_router, prefix="/api")
app.include_router(auth_router)
app.include_router(applications_router)
app.include_router(jobs_router)


@app.on_event("startup")
def create_database_tables() -> None:
    init_db()


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "JobUp API is running", "status": "ok"}
