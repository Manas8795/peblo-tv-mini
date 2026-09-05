from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ArtworkUploadResponse(BaseModel):
    id: str
    artwork_type: str
    url: str
    storage_key: str
    width: int
    height: int
    size_bytes: int
    checksum: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ArtworkValidationResult(BaseModel):
    is_valid: bool
    error_message: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    aspect_ratio: Optional[str] = None
    size_kb: Optional[float] = None
