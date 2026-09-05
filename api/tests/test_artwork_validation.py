import io
from PIL import Image
from app.services.artwork_service import ArtworkService

def create_mock_image(width: int, height: int, format: str = "JPEG", size_fill_kb: int = 10) -> bytes:
    img = Image.new("RGB", (width, height), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format=format)
    data = buf.getvalue()
    if size_fill_kb > 0 and len(data) < size_fill_kb * 1024:
        # Pad with dummy bytes at end if needed
        data += b"\x00" * (size_fill_kb * 1024 - len(data))
    return data

def test_poster_valid_dimensions():
    # 600x900 is 2:3 aspect ratio
    img_bytes = create_mock_image(600, 900, "JPEG", size_fill_kb=15)
    res = ArtworkService.validate_image_file("poster", img_bytes, "poster.jpg")
    assert res.is_valid is True
    assert res.error_message is None
    assert res.width == 600
    assert res.height == 900

def test_banner_valid_dimensions():
    # 1280x720 is 16:9 aspect ratio
    img_bytes = create_mock_image(1280, 720, "JPEG", size_fill_kb=25)
    res = ArtworkService.validate_image_file("banner", img_bytes, "banner.jpg")
    assert res.is_valid is True
    assert res.error_message is None

def test_thumbnail_valid_dimensions():
    # 640x360 is 16:9 aspect ratio
    img_bytes = create_mock_image(640, 360, "JPEG", size_fill_kb=8)
    res = ArtworkService.validate_image_file("thumbnail", img_bytes, "thumb.jpg")
    assert res.is_valid is True
    assert res.error_message is None

def test_poster_wrong_aspect_ratio():
    # 900x600 is 3:2 instead of 2:3
    img_bytes = create_mock_image(900, 600, "JPEG", size_fill_kb=15)
    res = ArtworkService.validate_image_file("poster", img_bytes, "poster_wrong.jpg")
    assert res.is_valid is False
    assert "Invalid aspect ratio" in res.error_message
    assert "2:3" in res.error_message

def test_artwork_exceeds_200kb_ceiling():
    # File size 250 KB exceeds 200 KB ceiling
    img_bytes = create_mock_image(600, 900, "JPEG", size_fill_kb=250)
    res = ArtworkService.validate_image_file("poster", img_bytes, "poster_huge.jpg")
    assert res.is_valid is False
    assert "exceeds maximum allowed limit of 200 KB" in res.error_message

def test_thumbnail_too_small():
    # 160x90 is tiny
    img_bytes = create_mock_image(160, 90, "JPEG", size_fill_kb=2)
    res = ArtworkService.validate_image_file("thumbnail", img_bytes, "thumb_tiny.jpg")
    assert res.is_valid is False
    assert "too small" in res.error_message

def test_invalid_image_format():
    corrupt_bytes = b"NOT_AN_IMAGE_CONTENT"
    res = ArtworkService.validate_image_file("poster", corrupt_bytes, "file.txt")
    assert res.is_valid is False
    assert "not a valid image format" in res.error_message
