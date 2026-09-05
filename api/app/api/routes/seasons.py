import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.season import Season
from app.db.models.show import Show
from app.schemas.season import SeasonCreate, SeasonResponse
from app.api.deps import require_role
from app.core.security import AuthUser

router = APIRouter(prefix="/seasons", tags=["Seasons"])

@router.post("", response_model=SeasonResponse, status_code=status.HTTP_201_CREATED)
def create_season(
    payload: SeasonCreate,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_role("editor"))
):
    show = db.query(Show).filter(Show.id == payload.show_id).first()
    if not show:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Show '{payload.show_id}' not found.")

    existing = db.query(Season).filter(
        Season.show_id == payload.show_id,
        Season.season_number == payload.season_number
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Season {payload.season_number} already exists for show '{show.title}'."
        )

    new_season = Season(
        id=str(uuid.uuid4()),
        show_id=payload.show_id,
        season_number=payload.season_number
    )
    db.add(new_season)
    db.commit()
    db.refresh(new_season)
    return new_season

@router.get("/{season_id}", response_model=SeasonResponse)
def get_season(
    season_id: str,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_role("editor"))
):
    season = db.query(Season).filter(Season.id == season_id).first()
    if not season:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Season '{season_id}' not found.")
    return season

@router.delete("/{season_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_season(
    season_id: str,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_role("editor"))
):
    season = db.query(Season).filter(Season.id == season_id).first()
    if not season:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Season '{season_id}' not found.")
    db.delete(season)
    db.commit()
    return None
