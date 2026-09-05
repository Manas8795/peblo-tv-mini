from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ValidationErrorItem(BaseModel):
    entity_type: str  # "show" or "episode"
    entity_id: str
    show_id: Optional[str] = None
    show_title: Optional[str] = None
    episode_title: Optional[str] = None
    season_number: Optional[int] = None
    episode_number: Optional[int] = None
    issue: str
    action_required: str

class ValidationReport(BaseModel):
    is_publishable: bool
    total_issues: int
    grouped_by_cause: Dict[str, List[ValidationErrorItem]]
    summary: Dict[str, int]
