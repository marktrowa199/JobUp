from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(auth_router)
app.include_router(jobs_router)


@app.on_event("startup")
def create_database_tables() -> None:
    init_db()


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "JobUp API is running", "status": "ok"}
