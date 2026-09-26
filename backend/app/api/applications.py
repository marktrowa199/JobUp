from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.database.models import JobApplication, User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStatusUpdate,
)

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.get("", response_model=list[ApplicationResponse])
def list_applications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[JobApplication]:
    return (
        db.query(JobApplication)
        .filter(JobApplication.user_id == user.id)
        .order_by(JobApplication.applied_at.desc())
        .all()
    )


@router.post("", response_model=ApplicationResponse)
def track_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> JobApplication:
    application = (
        db.query(JobApplication)
        .filter(JobApplication.user_id == user.id, JobApplication.job_id == payload.job_id)
        .first()
    )
    if application:
        return application

    application = JobApplication(
        user_id=user.id,
        job_id=payload.job_id,
        title=payload.title,
        company=payload.company,
        location=payload.location,
        url=str(payload.url),
        status="In Progress",
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.patch("/{application_id}", response_model=ApplicationResponse)
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> JobApplication:
    application = (
        db.query(JobApplication)
        .filter(JobApplication.id == application_id, JobApplication.user_id == user.id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    application.status = payload.status.value
    db.commit()
    db.refresh(application)
    return application