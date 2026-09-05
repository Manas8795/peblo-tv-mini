from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.publish_run import PublishRun
from app.services.publish_service import PublishService
from app.schemas.publish import PublishResult, PublishRunResponse, PublishTriggerRequest
from app.api.deps import require_role
from app.core.security import AuthUser

router = APIRouter(prefix="/admin/catalog", tags=["Publish"])

@router.post("/publish", response_model=PublishResult, status_code=status.HTTP_200_OK)
def trigger_publish(
    payload: PublishTriggerRequest = None,
    db: Session = Depends(get_db),
    # Strictly enforce 'admin' role! Editors get 403 Forbidden
    current_user: AuthUser = Depends(require_role("admin"))
):
    """
    Builds the public catalogue JSON and writes it atomically to storage.
    Enforces 'admin' authorization role.
    """
    triggered_by = current_user.email or current_user.id
    result = PublishService.execute_publish(db=db, triggered_by=triggered_by)
    return result

@router.get("/runs", response_model=List[PublishRunResponse])
def list_publish_runs(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_role("editor"))
):
    """
    Returns audit history of publish runs (both successful and failed).
    """
    runs = db.query(PublishRun).order_by(PublishRun.started_at.desc()).limit(limit).all()
    return runs
