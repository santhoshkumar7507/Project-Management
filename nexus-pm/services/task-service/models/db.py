import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


def new_uuid():
    return str(uuid.uuid4())


class Project(Base):
    __tablename__ = "projects"

    id          = Column(CHAR(36), primary_key=True, default=new_uuid)
    name        = Column(String(200), nullable=False)
    description = Column(Text)
    owner_id    = Column(CHAR(36), nullable=False)
    status      = Column(Enum("active", "archived"), default="active")
    created_at  = Column(DateTime, default=datetime.utcnow)


class Task(Base):
    __tablename__ = "tasks"

    id          = Column(CHAR(36), primary_key=True, default=new_uuid)
    project_id  = Column(CHAR(36), ForeignKey("projects.id"), nullable=False)
    title       = Column(String(300), nullable=False)
    description = Column(Text)
    status      = Column(Enum("todo", "in_progress", "review", "done"), default="todo")
    priority    = Column(Enum("low", "medium", "high", "critical"), default="medium")
    assignee_id = Column(CHAR(36), nullable=True)
    sprint_id   = Column(CHAR(36), nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Sprint(Base):
    __tablename__ = "sprints"

    id         = Column(CHAR(36), primary_key=True, default=new_uuid)
    project_id = Column(CHAR(36), ForeignKey("projects.id"), nullable=False)
    name       = Column(String(200), nullable=False)
    goal       = Column(Text)
    status     = Column(Enum("planning", "active", "completed"), default="planning")
    start_date = Column(DateTime)
    end_date   = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
