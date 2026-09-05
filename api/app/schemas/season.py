from pydantic import BaseModel, Field
from typing import Optional, List
from app.schemas.episode import EpisodeResponse

class SeasonBase(BaseModel):
    season_number: int = Field(..., ge=0)

class SeasonCreate(SeasonBase):
    show_id: str

class SeasonResponse(SeasonBase):
    id: str
    show_id: str
    episodes: List[EpisodeResponse] = []

    class Config:
        from_attributes = True
