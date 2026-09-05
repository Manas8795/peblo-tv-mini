import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import get_db
from app.db.models.show import Show
from app.schemas.show import ShowCreate, ShowUpdate, ShowResponse, ShowListResponse
from app.api.deps import require_role
from app.core.constants import SECTIONS
from app.core.security import AuthUser

router = APIRouter(prefix="/shows", tags=["Shows"])

@router.get("", response_model=ShowListResponse)
def list_shows(
    search: Optional[str] = Query(None, description="Search show title or synopsis"),
    section: Optional[str] = Query(None, description="Filter by section"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (draft, published)"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_role("editor"))
):
    query = db.query(Show)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(or_(Show.title.ilike(term), Show.synopsis.ilike(term)))

    if section:
        query = query.filter(Show.section == section)

    if status_filter:
        query = query.filter(Show.status == status_filter)

    total = query.count()
    items = query.order_by(Show.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return ShowListResponse(total=total, items=items)

@router.post("", response_model=ShowResponse, status_code=status.HTTP_201_CREATED)
def create_show(
    payload: ShowCreate,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_role("editor"))
):
    if payload.section and payload.section not in SECTIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid section '{payload.section}'. Allowed sections: {SECTIONS}"
        )

    if payload.status == "published" and not payload.section:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A published show must have a valid section assigned."
        )

    new_show = Show(
        id=str(uuid.uuid4()),
        title=payload.title,
        slug=payload.slug or payload.title.lower().replace(" ", "-"),
        synopsis=payload.synopsis,
        section=payload.section,
        status=payload.status
    )
    db.add(new_show)
    db.commit()
    db.refresh(new_show)
    return new_show

@router.get("/{show_id}", response_model=ShowResponse)
def get_show(
    show_id: str,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_role("editor"))
):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Show with id '{show_id}' not found.")
    return show

@router.put("/{show_id}", response_model=ShowResponse)
def update_show(
    show_id: str,
    payload: ShowUpdate,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_role("editor"))
):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Show with id '{show_id}' not found.")

    if payload.section is not None:
        if payload.section and payload.section not in SECTIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid section '{payload.section}'. Allowed sections: {SECTIONS}"
            )
        show.section = payload.section

    if payload.status is not None:
        if payload.status == "published" and not (show.section or payload.section):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A published show must have a valid section assigned."
            )
        show.status = payload.status

    if payload.title is not None:
        show.title = payload.title
    if payload.slug is not None:
        show.slug = payload.slug
    if payload.synopsis is not None:
        show.synopsis = payload.synopsis

    db.commit()
    db.refresh(show)
    return show

@router.delete("/{show_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_show(
    show_id: str,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_role("editor"))
):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Show with id '{show_id}' not found.")
    db.delete(show)
    db.commit()
    return None
