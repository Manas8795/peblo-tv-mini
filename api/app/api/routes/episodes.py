import json
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import get_db
from app.db.models.episode import Episode
from app.db.models.season import Season
from app.schemas.episode import EpisodeCreate, EpisodeUpdate, EpisodeResponse
from app.api.deps import require_role
from app.core.security import AuthUser
from app.core.constants import LANGUAGES, CATEGORIES

router = APIRouter(prefix="/episodes", tags=["Episodes"])

@router.get("", response_model=List[EpisodeResponse])
def list_episodes(
    show_id: Optional[str] = Query(None),
    season_id: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_role("editor"))
):
    query = db.query(Episode)

    if season_id:
        query = query.filter(Episode.season_id == season_id)
    elif show_id:
        query = query.join(Season).filter(Season.show_id == show_id)

    if language:
        query = query.filter(Episode.language == language)
    if status_filter:
        query = query.filter(Episode.status == status_filter)

    return query.order_by(Episode.episode_number).all()

@router.post("", response_model=EpisodeResponse, status_code=status.HTTP_201_CREATED)
def create_episode(
    payload: EpisodeCreate,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_role("editor"))
):
    season = db.query(Season).filter(Season.id == payload.season_id).first()
    if not season:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Season '{payload.season_id}' not found.")

    # Unique constraint check: (content_group, language)
    if payload.content_group:
        conflict = db.query(Episode).filter(
            Episode.content_group == payload.content_group,
            Episode.language == payload.language
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An episode with content_group '{payload.content_group}' and language '{payload.language}' already exists (ID: {conflict.id})."
            )

    # Validation: cannot publish without duration
    if payload.status == "published":
        if not payload.duration_seconds or payload.duration_seconds <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Episode cannot be marked as published without a valid duration (seconds > 0)."
            )

    cats_json = json.dumps(payload.categories) if payload.categories else None
    primary_cat = payload.category or (payload.categories[0] if payload.categories else None)

    new_ep = Episode(
        id=str(uuid.uuid4()),
        season_id=payload.season_id,
        episode_number=payload.episode_number,
        title=payload.title,
        synopsis=payload.synopsis,
        duration_seconds=payload.duration_seconds,
        category=primary_cat,
        categories_json=cats_json,
        language=payload.language,
        content_group=payload.content_group,
        status=payload.status
    )
    db.add(new_ep)
    db.commit()
    db.refresh(new_ep)
    return new_ep

@router.get("/{episode_id}", response_model=EpisodeResponse)
def get_episode(
    episode_id: str,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_role("editor"))
):
    ep = db.query(Episode).filter(Episode.id == episode_id).first()
    if not ep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Episode '{episode_id}' not found.")
    return ep

@router.put("/{episode_id}", response_model=EpisodeResponse)
def update_episode(
    episode_id: str,
    payload: EpisodeUpdate,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_role("editor"))
):
    ep = db.query(Episode).filter(Episode.id == episode_id).first()
    if not ep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Episode '{episode_id}' not found.")

    target_cg = payload.content_group if payload.content_group is not None else ep.content_group
    target_lang = payload.language if payload.language is not None else ep.language

    # Check unique constraint if changing content_group or language
    if target_cg and (payload.content_group is not None or payload.language is not None):
        conflict = db.query(Episode).filter(
            Episode.content_group == target_cg,
            Episode.language == target_lang,
            Episode.id != ep.id
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Conflict: (content_group '{target_cg}', language '{target_lang}') already exists."
            )

    # Check publishing requirements
    target_status = payload.status if payload.status is not None else ep.status
    target_dur = payload.duration_seconds if payload.duration_seconds is not None else ep.duration_seconds

    if target_status == "published":
        if not target_dur or target_dur <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Episode cannot be marked as published without a valid duration."
            )
        # Check artwork existence
        has_thumbnail = any(a.artwork_type == "thumbnail" for a in ep.artwork)
        if not has_thumbnail and len(ep.artwork) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Episode cannot be published without at least one artwork (thumbnail)."
            )

    if payload.title is not None:
        ep.title = payload.title
    if payload.episode_number is not None:
        ep.episode_number = payload.episode_number
    if payload.synopsis is not None:
        ep.synopsis = payload.synopsis
    if payload.duration_seconds is not None:
        ep.duration_seconds = payload.duration_seconds
    if payload.category is not None:
        ep.category = payload.category
    if payload.categories is not None:
        ep.categories_json = json.dumps(payload.categories)
    if payload.language is not None:
        ep.language = payload.language
    if payload.content_group is not None:
        ep.content_group = payload.content_group
    if payload.status is not None:
        ep.status = payload.status

    db.commit()
    db.refresh(ep)
    return ep

@router.delete("/{episode_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_episode(
    episode_id: str,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_role("editor"))
):
    ep = db.query(Episode).filter(Episode.id == episode_id).first()
    if not ep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Episode '{episode_id}' not found.")
    db.delete(ep)
    db.commit()
    return None
