# API contracts — Fleet Inspection And Maintenance

The OpenAPI document is the authoritative contract: Swagger UI at `/docs`, raw document at `/openapi.json`. This table is the summary.

| Method | Path | Purpose | Response |
| --- | --- | --- | --- |
| `GET` | `/health` | Liveness probe used by the deploy pipeline | `{"status": "ok"}` |
| `GET` | `/api/maintenances` | List maintenances; `?status=` filters | `Maintenance[]` |
| `POST` | `/api/maintenances` | Create a maintenance | `201` + `Maintenance` |
| `GET` | `/api/maintenances/{id}` | Fetch one maintenance | `Maintenance` or `404` |
| `PATCH` | `/api/maintenances/{id}` | Partial update | `Maintenance` or `404` |
| `DELETE` | `/api/maintenances/{id}` | Remove a maintenance | `204` or `404` |

## `Maintenance`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | integer | Server assigned |
| `title` | string | Required, 1–400 characters |
| `reference` | string | Optional, up to 200 characters |
| `status` | enum | `new`, `in-progress`, `complete` |
| `priority` | enum | `low`, `normal`, `high` |
