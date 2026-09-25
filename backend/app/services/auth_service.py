from datetime import datetime, timedelta, timezone
import secrets

from pwdlib import PasswordHash
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.models import AuthSession, User

password_hasher = PasswordHash.recommended()


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return password_hasher.verify(password, password_hash)


def find_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == normalize_email(email)))


def create_user(db: Session, full_name: str, email: str, password: str) -> User:
    now = datetime.now(timezone.utc)
    user = User(
        full_name=full_name.strip(),
        email=normalize_email(email),
        password_hash=hash_password(password),
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_session(db: Session, user: User) -> tuple[str, datetime]:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=settings.session_expiry_days)
    token = secrets.token_urlsafe(48)
    db.add(
        AuthSession(
            session_token=token,
            user_id=user.id,
            expires_at=expires_at,
            created_at=now,
        )
    )
    db.commit()
    return token, expires_at


def get_user_for_session(db: Session, token: str | None) -> User | None:
    if not token:
        return None

    session = db.scalar(
        select(AuthSession).where(
            AuthSession.session_token == token,
            AuthSession.expires_at > datetime.now(timezone.utc),
        )
    )
    if not session:
        return None
    return session.user


def delete_session(db: Session, token: str | None) -> None:
    if token:
        db.execute(delete(AuthSession).where(AuthSession.session_token == token))
        db.commit()
