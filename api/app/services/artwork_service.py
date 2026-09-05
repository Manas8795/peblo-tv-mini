import hashlib
import io
from typing import Tuple, Optional
from PIL import Image
from fastapi import UploadFile, HTTPException, status
from app.core.constants import ARTWORK_SPECS, MAX_ARTWORK_KB, ASPECT_TOLERANCE
from app.schemas.artwork import ArtworkValidationResult

class ArtworkService:
    @staticmethod
    def validate_image_file(
        artwork_type: str,
        file_bytes: bytes,
        filename: str
    ) -> ArtworkValidationResult:
        if artwork_type not in ARTWORK_SPECS:
            return ArtworkValidationResult(
                is_valid=False,
                error_message=f"Unknown artwork type '{artwork_type}'. Allowed types: {list(ARTWORK_SPECS.keys())}"
            )

        # 1. Enforce 200 KB ceiling
        size_bytes = len(file_bytes)
        size_kb = size_bytes / 1024.0
        if size_kb > MAX_ARTWORK_KB:
            return ArtworkValidationResult(
                is_valid=False,
                error_message=f"File size {size_kb:.1f} KB exceeds maximum allowed limit of {MAX_ARTWORK_KB} KB. Please compress your image.",
                size_kb=round(size_kb, 1)
            )

        # 2. Inspect image data with PIL
        try:
            image = Image.open(io.BytesIO(file_bytes))
            image.verify()  # verify image integrity
            # Re-open because verify() consumes image state
            image = Image.open(io.BytesIO(file_bytes))
            width, height = image.size
        except Exception as e:
            return ArtworkValidationResult(
                is_valid=False,
                error_message=f"Uploaded file is not a valid image format. Please upload JPG or PNG."
            )

        specs = ARTWORK_SPECS[artwork_type]
        target_w, target_h = specs["target_px"]
        expected_aspect_str = specs["aspect"]
        expected_ratio = target_w / float(target_h)
        actual_ratio = width / float(height)

        # 3. Check Aspect Ratio with reasonable tolerance (5%)
        ratio_diff = abs(actual_ratio - expected_ratio) / expected_ratio
        if ratio_diff > ASPECT_TOLERANCE:
            return ArtworkValidationResult(
                is_valid=False,
                error_message=(
                    f"Invalid aspect ratio for {artwork_type}. Expected {expected_aspect_str} "
                    f"(approx {target_w}x{target_h}), but received {width}x{height} "
                    f"({width}:{height} ratio). Please crop or resize to {expected_aspect_str}."
                ),
                width=width,
                height=height,
                aspect_ratio=f"{width}:{height}",
                size_kb=round(size_kb, 1)
            )

        # 4. Check minimum resolution bounds (reject tiny blurry placeholders)
        min_w = int(target_w * 0.7)
        min_h = int(target_h * 0.7)
        max_w = int(target_w * 1.5)
        max_h = int(target_h * 1.5)

        if width < min_w or height < min_h:
            return ArtworkValidationResult(
                is_valid=False,
                error_message=(
                    f"Image resolution {width}x{height} is too small for a {artwork_type}. "
                    f"Recommended target is {target_w}x{target_h} px (minimum {min_w}x{min_h} px)."
                ),
                width=width,
                height=height,
                size_kb=round(size_kb, 1)
            )

        if width > max_w or height > max_h:
            return ArtworkValidationResult(
                is_valid=False,
                error_message=(
                    f"Image resolution {width}x{height} is unnecessarily large for {artwork_type}. "
                    f"Target is {target_w}x{target_h} px (maximum {max_w}x{max_h} px)."
                ),
                width=width,
                height=height,
                size_kb=round(size_kb, 1)
            )

        return ArtworkValidationResult(
            is_valid=True,
            width=width,
            height=height,
            aspect_ratio=f"{width}:{height}",
            size_kb=round(size_kb, 1)
        )

    @staticmethod
    def calculate_checksum(file_bytes: bytes) -> str:
        return hashlib.sha256(file_bytes).hexdigest()
