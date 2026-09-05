import json
from pathlib import Path
from typing import Dict, Any, List

# Load reference.json from root or fallback
REFERENCE_PATH = Path(__file__).resolve().parents[4] / "reference.json"
if not REFERENCE_PATH.exists():
    REFERENCE_PATH = Path(__file__).resolve().parents[3] / "reference.json"

if REFERENCE_PATH.exists():
    with open(REFERENCE_PATH, "r", encoding="utf-8") as f:
        _REF_DATA: Dict[str, Any] = json.load(f)
else:
    _REF_DATA = {
        "sections": ["featured", "series", "minisodes", "songs"],
        "categories": [
            "adventure", "folk", "friendship", "india", "language",
            "learning", "maths", "music", "nature", "reading",
            "science", "singalong", "stories", "travel", "values"
        ],
        "languages": ["en", "hi"],
        "artwork_specs": {
            "poster": {"aspect": "2:3", "target_px": [600, 900], "max_kb": 200},
            "banner": {"aspect": "16:9", "target_px": [1280, 720], "max_kb": 200},
            "thumbnail": {"aspect": "16:9", "target_px": [640, 360], "max_kb": 200}
        }
    }

SECTIONS: List[str] = _REF_DATA.get("sections", [])
CATEGORIES: List[str] = _REF_DATA.get("categories", [])
LANGUAGES: List[str] = _REF_DATA.get("languages", [])
ARTWORK_SPECS: Dict[str, Any] = _REF_DATA.get("artwork_specs", {})
MAX_ARTWORK_KB: int = 200
ASPECT_TOLERANCE: float = 0.05  # 5% tolerance for aspect ratio
DIMENSION_TOLERANCE: float = 0.15  # 15% tolerance around target dimensions
