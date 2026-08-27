# Delivery plan — Fleet Inspection And Maintenance

Sprints are two weeks. Each sprint closes with a demo and an approval gate.

| Sprint | Focus | Exit criteria |
| --- | --- | --- |
| Sprint 1 | Foundation: repo, pipelines, schema | CI green, API deployed |
| Sprint 2 | Core scope | Approved user stories delivered |
| Sprint 3 | Hardening and release | Tests pass, release gate approved |

## Approved scope

- **Authoritative requirements:** `Fleet Inspection And Maintenance - Requirements.docx`, `...Technical Requirements.docx`, `...UX Mockups.docx`.
- **Approved artifact on record:** Requirements Agent summary (plan-stage, not an implementation baseline).
- **Repository discovery:** Source tree could not be enumerated from this environment, so file paths and framework usage in this proposal align with the documented tech stack (Angular 18/Ionic 8 front end, FastAPI 3.12 back end, Azure SQL, Blob Storage, Foundry via APIM). Please confirm or adjust once the repo layout is visible during implementation.
- Create Alembic migration(s) with foreign keys, unique constraints to enforce immutability (e.g., disable `ON UPDATE` for inspection rows, rely on append-only `status` fields).
- Store evidence URIs referencing immutable Blob containers (use SAS-less managed identity + container-level immutability policy).
- Add triggers or stored procedures only if mandated; otherwise rely on service-layer invariants plus SQL constraints (e.g., ensure `inspection_items.result='FAIL'` implies evidence columns are non-null).
- `app/models/inspection.py` (SQLAlchemy models + Pydantic schemas; leverage `Annotated` types for stricter validation).
- `app/api/routes/inspections.py`
- `POST /api/v1/inspections`: accepts inspection payload, validates odometer monotonicity, caches offline timestamps (`captured_at` vs `submitted_at`), persists header and line items transactionally, enqueues defect classification requests when failures exist, initiates grounding workflow for critical defects.
- `GET /api/v1/vehicles/{vehicle_id}/grounding-status`: feeds SCR-02 banner and prevents trip start.
- `app/services/grounding.py`: orchestrates Azure SQL transaction + call to Grounding Adapter (retry w/ exponential back-off, idempotency key = inspection_id + vehicle_id).
- `app/services/notifications.py`: interface to notification dispatcher (Graph mail, Teams). Implements ordered channel fallback, logs to `notification_attempts`.
