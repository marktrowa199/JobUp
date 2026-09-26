from datetime import datetime, time, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.database.models import JobApplication, User
from app.schemas.application import ApplicationCreate, ApplicationResponse, ApplicationUpdate

router = APIRouter(prefix="/api/applications", tags=["applications"])


def application_query(db: Session, user: User):
    return db.query(JobApplication).filter(JobApplication.user_id == user.id)


@router.get("", response_model=list[ApplicationResponse])
def list_applications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[JobApplication]:
    return application_query(db, user).order_by(JobApplication.applied_at.desc()).all()


@router.post("", response_model=ApplicationResponse)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> JobApplication:
    job_id = payload.job_id or f"manual:{uuid4().hex}"
    if payload.job_id:
        existing = application_query(db, user).filter(JobApplication.job_id == job_id).first()
    else:
        existing = application_query(db, user).filter(
            func.lower(JobApplication.title) == payload.title.lower(),
            func.lower(JobApplication.company) == payload.company.lower(),
        ).first()
    if existing and not payload.allow_duplicate:
        return existing
    if existing and payload.job_id:
        job_id = f"{job_id[:460]}:copy:{uuid4().hex}"

    applied_at = datetime.combine(payload.application_date or datetime.now(timezone.utc).date(), time.min, tzinfo=timezone.utc)
    application = JobApplication(
        user_id=user.id,
        job_id=job_id,
        title=payload.title,
        company=payload.company,
        location=payload.location or "Not specified",
        url=str(payload.url) if payload.url else "",
        status=payload.status.value,
        next_action=payload.next_action.value if payload.status.value == "Interview" and payload.next_action else None,
        applied_at=applied_at,
        salary=payload.salary,
        company_website=str(payload.company_website) if payload.company_website else None,
        contact_person=payload.contact_person,
        contact_information=payload.contact_information,
        notes=payload.notes,
    )
    db.add(application)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if not payload.allow_duplicate:
            existing = application_query(db, user).filter(JobApplication.job_id == job_id).first()
            if existing:
                return existing
        raise HTTPException(status_code=409, detail="This application could not be saved as a duplicate.")
    db.refresh(application)
    return application


@router.patch("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: int,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> JobApplication:
    application = application_query(db, user).filter(JobApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    updates = payload.model_dump(exclude_unset=True)
    if "application_date" in updates:
        app_date = updates.pop("application_date")
        if app_date is not None:
            application.applied_at = datetime.combine(app_date, time.min, tzinfo=timezone.utc)
    for field, value in updates.items():
        if field == "status":
            application.status = value.value if value else application.status
        elif field == "next_action":
            application.next_action = value.value if value else None
        elif field in {"url", "company_website"}:
            setattr(application, field, str(value) if value else ("" if field == "url" else None))
        elif field == "location":
            application.location = value or "Not specified"
        else:
            setattr(application, field, value)

    if application.status != "Interview":
        application.next_action = None
    db.commit()
    db.refresh(application)
    return application


@router.delete("/{application_id}", status_code=204)
def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    application = application_query(db, user).filter(JobApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")
    db.delete(application)
    db.commit()
    return Response(status_code=204)
