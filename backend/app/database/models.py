from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sessions: Mapped[list["AuthSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    applications: Mapped[list["JobApplication"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class AuthSession(Base):
    __tablename__ = "auth_sessions"
    __table_args__ = (Index("ix_auth_sessions_token", "session_token", unique=True),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_token: Mapped[str] = mapped_column(String(128), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    user: Mapped[User] = relationship(back_populates="sessions")


class JobApplication(Base):
    __tablename__ = "job_applications"
    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_job_applications_user_job"),
        Index("ix_job_applications_user_applied_at", "user_id", "applied_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id: Mapped[str] = mapped_column(String(512), nullable=False)
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    company: Mapped[str] = mapped_column(String(250), nullable=False)
    location: Mapped[str] = mapped_column(String(250), nullable=False)
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="In Progress")
    applied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    user: Mapped[User] = relationship(back_populates="applications")
