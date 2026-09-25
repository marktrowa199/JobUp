from datetime import datetime
from email.message import EmailMessage
import logging
import smtplib

from app.core.config import settings
from app.database.models import User

logger = logging.getLogger(__name__)


def _email_configured() -> bool:
    return all((settings.email_host, settings.email_username, settings.email_password, settings.email_from))


def send_login_notification(user: User, login_time: datetime) -> bool:
    if not _email_configured():
        logger.info("Login email skipped because SMTP is not configured.")
        return False

    message = EmailMessage()
    message["Subject"] = "New JobUp login"
    message["From"] = settings.email_from
    message["To"] = user.email
    formatted_time = login_time.astimezone().strftime("%B %d, %Y at %I:%M %p %Z")
    message.set_content(
        f"Hello {user.full_name},\n\n"
        "Your JobUp account was successfully logged into.\n\n"
        f"Login time:\n{formatted_time}\n\n"
        "If this was you, no action is required.\n\n"
        "If you do not recognize this login, please secure your JobUp account.\n\n"
        "- JobUp\n"
    )

    try:
        with smtplib.SMTP(settings.email_host, settings.email_port, timeout=15) as smtp:
            if settings.email_use_tls:
                smtp.starttls()
            if settings.email_username:
                smtp.login(settings.email_username, settings.email_password)
            smtp.send_message(message)
        return True
    except (OSError, smtplib.SMTPException):
        logger.exception("Unable to send login notification email for user %s", user.id)
        return False
