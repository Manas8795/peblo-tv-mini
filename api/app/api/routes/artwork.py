import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.artwork import Artwork
from app.db.models.show import Show
from app.db.models.episode import Episode
from app.services.artwork_service import ArtworkService
from app.schemas.artwork import ArtworkUploadResponse
from app.storage import get_storage
from app.api.deps import require_role
from app.core.security import AuthUser

router = APIRouter(prefix="/artwork", tags=["Artwork"])

@router.post("/upload", response_model=ArtworkUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_artwork(
    file: UploadFile = File(..., description="Image file (JPG, PNG)"),
    artwork_type: str = Form(..., description="poster, banner, or thumbnail"),
    show_id: Optional[str] = Form(None, description="Show ID to attach artwork to"),
    episode_id: Optional[str] = Form(None, description="Episode ID to attach artwork to"),
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(require_role("editor"))
):
    # 1. Read file bytes
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty. Please select an image to upload."
        )

    # 2. Server-side validation (aspect ratio, dimensions, 200 KB ceiling)
    validation = ArtworkService.validate_image_file(
        artwork_type=artwork_type.lower().strip(),
        file_bytes=file_bytes,
        filename=file.filename or "image.jpg"
    )

    if not validation.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation.error_message
        )

    # 3. Verify association targets
    if show_id:
        show = db.query(Show).filter(Show.id == show_id).first()
        if not show:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Show '{show_id}' not found.")
    if episode_id:
        ep = db.query(Episode).filter(Episode.id == episode_id).first()
        if not ep:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Episode '{episode_id}' not found.")

    # 4. Upload to Storage Backend
    storage = get_storage()
    file_ext = (file.filename or "jpg").split(".")[-1].lower()
    if file_ext not in ["jpg", "jpeg", "png", "webp"]:
        file_ext = "jpg"

    storage_key = f"artwork/{artwork_type}_{uuid.uuid4().hex[:12]}.{file_ext}"
    content_type = file.content_type or ("image/png" if file_ext == "png" else "image/jpeg")

    storage.put(storage_key, file_bytes, content_type=content_type)
    public_url = storage.get_url(storage_key)
    checksum = ArtworkService.calculate_checksum(file_bytes)

    # 5. Remove previous artwork of the same type for this entity if exists
    if show_id:
        old_artworks = db.query(Artwork).filter(Artwork.show_id == show_id, Artwork.artwork_type == artwork_type).all()
        for old in old_artworks:
            db.delete(old)
    if episode_id:
        old_artworks = db.query(Artwork).filter(Artwork.episode_id == episode_id, Artwork.artwork_type == artwork_type).all()
        for old in old_artworks:
            db.delete(old)

    # 6. Save new artwork record in database
    new_artwork = Artwork(
        id=str(uuid.uuid4()),
        show_id=show_id,
        episode_id=episode_id,
        artwork_type=artwork_type.lower().strip(),
        storage_key=storage_key,
        url=public_url,
        width=validation.width,
        height=validation.height,
        size_bytes=len(file_bytes),
        checksum=checksum
    )
    db.add(new_artwork)
    db.commit()
    db.refresh(new_artwork)

    return new_artwork
