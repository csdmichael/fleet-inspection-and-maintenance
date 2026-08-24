from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_reports_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_openapi_document_is_served():
    document = client.get("/openapi.json")
    assert document.status_code == 200
    assert "/api/maintenances" in document.json()["paths"]
