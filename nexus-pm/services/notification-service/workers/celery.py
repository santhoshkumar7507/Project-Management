import os
import smtplib
from email.mime.text import MIMEText
from celery import Celery

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/1")
celery = Celery("nexus_notify", broker=REDIS_URL, backend=REDIS_URL)


@celery.task(bind=True, max_retries=3)
def send_assignment_email(self, assignee_email: str, task_title: str, project_id: str):
    try:
        msg = MIMEText(
            f"Hi,\n\nYou have been assigned the task: '{task_title}'.\n\n"
            f"Project ID: {project_id}\n\nVisit Nexus PM to view it.\n\nNexus PM Team"
        )
        msg["Subject"] = f"[Nexus PM] Task assigned: {task_title}"
        msg["From"] = "no-reply@nexus-pm.dev"
        msg["To"] = assignee_email

        smtp_host = os.environ.get("SMTP_HOST", "mailhog")
        smtp_port = int(os.environ.get("SMTP_PORT", 1025))
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.sendmail(msg["From"], [assignee_email], msg.as_string())
    except Exception as exc:
        raise self.retry(exc=exc, countdown=10)


@celery.task
def send_status_change_email(assignee_email: str, task_title: str, old_status: str, new_status: str):
    msg = MIMEText(
        f"Hi,\n\nTask '{task_title}' moved from '{old_status}' → '{new_status}'.\n\nNexus PM Team"
    )
    msg["Subject"] = f"[Nexus PM] Task updated: {task_title}"
    msg["From"] = "no-reply@nexus-pm.dev"
    msg["To"] = assignee_email
    smtp_host = os.environ.get("SMTP_HOST", "mailhog")
    smtp_port = int(os.environ.get("SMTP_PORT", 1025))
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.sendmail(msg["From"], [assignee_email], msg.as_string())
