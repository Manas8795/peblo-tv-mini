from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.validation_service import ValidationService
from app.schemas.validation import ValidationReport
from app.api.deps import require_role
from app.core.security import AuthUser

router = APIRouter(prefix="/admin", tags=["Validation"])

@router.get("/validation-report", response_model=ValidationReport)
def get_validation_report(
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_role("editor"))
):
    """
    Validation report returning all issues preventing catalogue publication,
    grouped by actionable root cause.
    """
    report = ValidationService.generate_report(db)
    return report
