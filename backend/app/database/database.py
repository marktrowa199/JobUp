from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator:
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()


def init_db() -> None:
    from app.database import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    columns = {column["name"] for column in inspect(engine).get_columns("job_applications")}
    application_columns = {
        "next_action": "VARCHAR(40)",
        "salary": "VARCHAR(250)",
        "company_website": "VARCHAR(2048)",
        "contact_person": "VARCHAR(200)",
        "contact_information": "VARCHAR(500)",
        "notes": "TEXT",
    }
    with engine.begin() as connection:
        for name, sql_type in application_columns.items():
            if name not in columns:
                connection.execute(text(f"ALTER TABLE job_applications ADD COLUMN {name} {sql_type}"))
        connection.execute(
            text("UPDATE job_applications SET status = 'Applications Submitted' WHERE status = 'Submitted'")
        )
