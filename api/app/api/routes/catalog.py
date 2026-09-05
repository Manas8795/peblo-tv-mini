import json
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import JSONResponse
from app.storage import get_storage
from app.services.search_service import SearchService
from app.schemas.catalog import SearchResultItem

router = APIRouter(prefix="/catalog", tags=["Catalog (Public)"])

@router.get("", response_class=JSONResponse)
def get_published_catalog():
    """
    Public Viewer Endpoint: Serves the current published catalogue.json.
    High performance, pre-compiled static JSON from storage.
    """
    storage = get_storage()
    catalog_key = "catalog/catalogue.json"

    if not storage.exists(catalog_key):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catalogue has not been published yet. Please publish the catalogue from CMS first."
        )

    try:
        raw_bytes = storage.get(catalog_key)
        data = json.loads(raw_bytes.decode("utf-8"))
        return JSONResponse(
            content=data,
            headers={
                "Cache-Control": "public, max-age=60",
                "Content-Type": "application/json"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read published catalogue: {str(e)}"
        )

@router.get("/search", response_model=List[SearchResultItem])
def search_catalog(
    q: Optional[str] = Query(None, description="Search term across show title, episode title, and categories"),
    category: Optional[str] = Query(None, description="Filter by category (adventure, india, etc.)"),
    language: Optional[str] = Query(None, description="Filter by language (en, hi)"),
    section: Optional[str] = Query(None, description="Filter by section (featured, series, minisodes, songs)")
):
    """
    Public Viewer Endpoint: Search and filter published shows and episodes.
    All supplied query parameters compose (AND logic).
    """
    results = SearchService.search_catalogue(
        q=q,
        category=category,
        language=language,
        section=section
    )
    return results
