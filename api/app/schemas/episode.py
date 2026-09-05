from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.artwork import ArtworkUploadResponse

class EpisodeBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    episode_number: int = Field(1, ge=1)
    synopsis: Optional[str] = None
    duration_seconds: Optional[int] = Field(None, ge=0)
    category: Optional[str] = None
    categories: Optional[List[str]] = []
    language: str = Field("en", pattern="^(en|hi)$")
    content_group: Optional[str] = None
    status: str = Field("draft", pattern="^(draft|published)$")

class EpisodeCreate(EpisodeBase):
    season_id: str

class EpisodeUpdate(BaseModel):
    title: Optional[str] = None
    episode_number: Optional[int] = None
    synopsis: Optional[str] = None
    duration_seconds: Optional[int] = None
    category: Optional[str] = None
    categories: Optional[List[str]] = None
    language: Optional[str] = None
    content_group: Optional[str] = None
    status: Optional[str] = None

class EpisodeResponse(EpisodeBase):
    id: str
    season_id: str
    created_at: datetime
    updated_at: datetime
    artwork: List[ArtworkUploadResponse] = []

    class Config:
        from_attributes = True
