from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.season import SeasonResponse
from app.schemas.artwork import ArtworkUploadResponse

class ShowBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    slug: Optional[str] = None
    synopsis: Optional[str] = None
    section: Optional[str] = None
    status: str = Field("draft", pattern="^(draft|published)$")

class ShowCreate(ShowBase):
    pass

class ShowUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    synopsis: Optional[str] = None
    section: Optional[str] = None
    status: Optional[str] = None

class ShowResponse(ShowBase):
    id: str
    created_at: datetime
    updated_at: datetime
    seasons: List[SeasonResponse] = []
    artwork: List[ArtworkUploadResponse] = []

    class Config:
        from_attributes = True

class ShowListResponse(BaseModel):
    total: int
    items: List[ShowResponse]
