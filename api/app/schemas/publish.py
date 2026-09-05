from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PublishTriggerRequest(BaseModel):
    note: Optional[str] = None

class PublishRunResponse(BaseModel):
    id: str
    triggered_by: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    status: str
    shows_count: int
    episodes_count: int
    outcome_message: Optional[str] = None
    catalogue_key: Optional[str] = None

    class Config:
        from_attributes = True

class PublishResult(BaseModel):
    run_id: str
    status: str
    shows_published: int
    episodes_published: int
    catalogue_url: str
    message: str
