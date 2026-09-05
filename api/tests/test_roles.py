from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

def test_editor_cannot_publish():
    # Editor role attempts admin publish -> must return 403
    response = client.post(
        "/admin/catalog/publish",
        headers={"X-API-Key": settings.EDITOR_API_KEY}
    )
    assert response.status_code == 403
    assert "Forbidden" in response.json()["detail"]
    assert "admin" in response.json()["detail"]

def test_admin_can_publish():
    # Admin role attempts admin publish -> must succeed with 200
    response = client.post(
        "/admin/catalog/publish",
        headers={"X-API-Key": settings.ADMIN_API_KEY}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_editor_can_view_validation_report():
    # Editor can view validation report
    response = client.get(
        "/admin/validation-report",
        headers={"X-API-Key": settings.EDITOR_API_KEY}
    )
    assert response.status_code == 200
    assert "grouped_by_cause" in response.json()

def test_unauthenticated_request_rejected():
    # Missing auth on protected endpoint -> 401 Unauthorized
    response = client.post("/admin/catalog/publish")
    assert response.status_code == 401

def test_public_catalog_requires_no_auth():
    # Public catalog endpoint requires no auth
    response = client.get("/catalog")
    assert response.status_code in [200, 404]
