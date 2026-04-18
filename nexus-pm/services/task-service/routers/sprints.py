from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from models.database import get_db
from models.db import Sprint

router = APIRouter(prefix="/api/sprints", tags=["sprints"])


class SprintCreate(BaseModel):
    project_id: str
    name: str
    goal: Optional[str] = ""
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class SprintUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


def row_to_dict(row):
    return {c.name: str(getattr(row, c.name)) if getattr(row, c.name) is not None else None
            for c in row.__table__.columns}


@router.get("/")
async def list_sprints(project_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    q = select(Sprint).order_by(Sprint.created_at.desc())
    if project_id:
        q = q.where(Sprint.project_id == project_id)
    result = await db.execute(q)
    return [row_to_dict(s) for s in result.scalars().all()]


@router.post("/", status_code=201)
async def create_sprint(body: SprintCreate, db: AsyncSession = Depends(get_db)):
    sprint = Sprint(**body.model_dump())
    db.add(sprint)
    await db.commit()
    await db.refresh(sprint)
    return row_to_dict(sprint)


@router.patch("/{sprint_id}")
async def update_sprint(sprint_id: str, body: SprintUpdate, db: AsyncSession = Depends(get_db)):
    sprint = await db.get(Sprint, sprint_id)
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(sprint, field, value)
    await db.commit()
    await db.refresh(sprint)
    return row_to_dict(sprint)
