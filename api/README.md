# Fleet Inspection And Maintenance — API

FastAPI service. Owns validation, authorization, and all database access.

| Path | Purpose |
| --- | --- |
| `/health` | Liveness probe |
| `/docs` | Swagger UI |
| `/openapi.json` | OpenAPI document |
| `/api/maintenances` | Maintenances collection (GET, POST) |
| `/api/maintenances/{id}` | Single maintenance (GET, PATCH, DELETE) |
