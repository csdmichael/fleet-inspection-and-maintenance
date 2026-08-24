from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_seeded_rows_are_listed():
    response = client.get("/api/maintenances")
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_round_trip():
    created = client.post("/api/maintenances", json={"title": "Created by tests"})
    assert created.status_code == 201
    item_id = created.json()["id"]

    patched = client.patch(f"/api/maintenances/{item_id}", json={"status": "complete"})
    assert patched.json()["status"] == "complete"

    assert client.delete(f"/api/maintenances/{item_id}").status_code == 204
    assert client.get(f"/api/maintenances/{item_id}").status_code == 404
