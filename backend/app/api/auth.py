from datetime import datetime, timezone
import logging

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.database import get_db
from app.database.models import User
from app.schemas.auth import AuthMessage, LoginRequest, LoginResponse, RegisterRequest, UserResponse
from app.services.auth_service import (
    create_session,
    create_user,
    delete_session,
    find_user_by_email,
    get_user_for_session,
    normalize_email,
    verify_password,
)
from app.services.email_service import send_login_notification

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])


def _cookie_secure() -> bool:
    return settings.environment.lower() == "production"


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=settings.session_expiry_days * 24 * 60 * 60,
        httponly=True,
        secure=_cookie_secure(),
        samesite="lax",
        path="/",
    )


def get_current_user(
    db: Session = Depends(get_db),
    session_token: str | None = Cookie(default=None, alias=settings.session_cookie_name),
) -> User:
    user = get_user_for_session(db, session_token)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    return user


@router.post("/register", response_model=AuthMessage, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthMessage:
    if find_user_by_email(db, normalize_email(payload.email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")

    try:
        create_user(db, payload.full_name, payload.email, payload.password)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.") from exc

    return AuthMessage(success=True, message="Account created successfully.")


@router.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> LoginResponse:
    user = find_user_by_email(db, normalize_email(payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    token, _ = create_session(db, user)
    _set_session_cookie(response, token)
    send_login_notification(user, datetime.now(timezone.utc))
    return LoginResponse(
        success=True,
        message="Login successful.",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(user)


@router.post("/logout", response_model=AuthMessage)
def logout(
    response: Response,
    db: Session = Depends(get_db),
    session_token: str | None = Cookie(default=None, alias=settings.session_cookie_name),
) -> AuthMessage:
    delete_session(db, session_token)
    response.delete_cookie(key=settings.session_cookie_name, path="/")
    return AuthMessage(success=True, message="You have been logged out.")
