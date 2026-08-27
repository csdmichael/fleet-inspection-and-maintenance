# Architecture — Fleet Inspection And Maintenance

## Tiers

| Tier | Folder | Technology | Responsibility |
| --- | --- | --- | --- |
| Web client | `ui/` | Angular + Ionic (TypeScript) | Rendering and user interaction |
| Service | `api/` | Python (FastAPI) | Validation, authorization, data access |
| Database | `db/` | PostgreSQL | Schema and forward-only migrations |

The technology in each tier was confirmed by a human at the Architecture and Design gate.

## Decisions

- The UI never connects to the database; all access flows through the API.
- Migrations are forward-only so every environment shares one history.
- Secrets come from environment variables or managed identity, never source.
