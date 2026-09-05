from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class CatalogueEpisode(BaseModel):
    id: str
    episode_number: int
    title: str
    synopsis: Optional[str] = None
    duration_seconds: int
    category: Optional[str] = None
    categories: List[str] = []
    languages: List[str] = []  # Collapsed language variants e.g. ["en", "hi"]
    content_group: Optional[str] = None
    thumbnail_url: Optional[str] = None
    banner_url: Optional[str] = None
    poster_url: Optional[str] = None

class CatalogueSeason(BaseModel):
    season_number: int
    episodes: List[CatalogueEpisode] = []

class CatalogueTrailer(BaseModel):
    id: str
    title: str
    duration_seconds: Optional[int] = None
    languages: List[str] = []
    thumbnail_url: Optional[str] = None

class CatalogueShow(BaseModel):
    id: str
    title: str
    slug: Optional[str] = None
    synopsis: Optional[str] = None
    section: str
    categories: List[str] = []
    poster_url: Optional[str] = None
    banner_url: Optional[str] = None
    seasons: List[CatalogueSeason] = []  # Normal seasons (Season 1..N)
    trailers: List[CatalogueTrailer] = []  # Season 0 trailers explicitly separated

class CatalogueSection(BaseModel):
    section: str
    shows: List[CatalogueShow] = []

class CatalogueData(BaseModel):
    version: str = "1.0"
    published_at: str
    total_shows: int
    total_episodes: int
    sections: Dict[str, List[CatalogueShow]] = {}
    all_shows: List[CatalogueShow] = []

class SearchResultItem(BaseModel):
    show_id: str
    show_title: str
    section: str
    categories: List[str] = []
    poster_url: Optional[str] = None
    banner_url: Optional[str] = None
    matched_episodes: List[CatalogueEpisode] = []
    relevance_score: Optional[float] = None
