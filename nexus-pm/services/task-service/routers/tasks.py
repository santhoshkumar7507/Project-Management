from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models.database import get_db
from models.db import Task
from events.producer import publish

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


class TaskCreate(BaseModel):
    project_id: str
    title: str
    description: Optional[str] = ""
    priority: Optional[str] = "medium"
    sprint_id: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    sprint_id: Optional[str] = None


class AssignPayload(BaseModel):
    user_id: str


def row_to_dict(row):
    return {c.name: str(getattr(row, c.name)) if getattr(row, c.name) is not None else None
            for c in row.__table__.columns}


@router.get("/")
async def list_tasks(project_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    q = select(Task).order_by(Task.created_at.desc())
    if project_id:
        q = q.where(Task.project_id == project_id)
    result = await db.execute(q)
    return [row_to_dict(t) for t in result.scalars().all()]


@router.post("/", status_code=201)
async def create_task(body: TaskCreate, db: AsyncSession = Depends(get_db)):
    task = Task(**body.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    await publish("task.created", {
        "task_id": task.id,
        "project_id": task.project_id,
        "title": task.title,
        "created_at": datetime.utcnow().isoformat(),
    })
    return row_to_dict(task)


@router.get("/{task_id}")
async def get_task(task_id: str, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return row_to_dict(task)


@router.patch("/{task_id}")
async def update_task(task_id: str, body: TaskUpdate, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    old_status = task.status
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    if body.status and body.status != old_status:
        await publish("task.updated", {
            "task_id": task.id,
            "project_id": task.project_id,
            "title": task.title,
            "old_status": old_status,
            "new_status": task.status,
            "updated_at": datetime.utcnow().isoformat(),
        })
    return row_to_dict(task)


@router.patch("/{task_id}/assign")
async def assign_task(task_id: str, body: AssignPayload, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.assignee_id = body.user_id
    task.status = "in_progress"
    await db.commit()
    await db.refresh(task)
    await publish("task.assigned", {
        "task_id": task.id,
        "project_id": task.project_id,
        "title": task.title,
        "assignee_id": body.user_id,
        "assigned_at": datetime.utcnow().isoformat(),
    })
    return row_to_dict(task)


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: str, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    await db.commit()
