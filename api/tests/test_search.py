from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

def setup_module():
    # Ensure catalogue is published before search tests
    client.post("/admin/catalog/publish", headers={"X-API-Key": settings.ADMIN_API_KEY})

def test_search_by_query_title():
    response = client.get("/catalog/search?q=Moti")
    assert response.status_code == 200
    results = response.json()
    assert len(results) > 0
    assert any("Moti" in r["show_title"] for r in results)

def test_search_filter_composition():
    # Category: "adventure", Section: "featured", Language: "en"
    response = client.get("/catalog/search?category=adventure&section=featured&language=en")
    assert response.status_code == 200
    results = response.json()
    assert len(results) > 0
    for r in results:
        assert r["section"] == "featured"
        assert "adventure" in [c.lower() for c in r["categories"]]
        # Matched episodes must include "en"
        for ep in r["matched_episodes"]:
            assert "en" in ep["languages"]

def test_search_non_matching_query_returns_empty():
    response = client.get("/catalog/search?q=NonExistentSuperHero9999")
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 0

def test_search_conflicting_filters_returns_empty():
    # Language: "hi", but Section: "songs" with no Hindi variant
    response = client.get("/catalog/search?section=nonexistent_section&language=en")
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 0
