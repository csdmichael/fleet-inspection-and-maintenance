# Delivery plan — Fleet Inspection And Maintenance

Sprints are two weeks. Each sprint closes with a demo and an approval gate.

| Sprint | Focus | Exit criteria |
| --- | --- | --- |
| Sprint 1 | Foundation: repo, pipelines, schema | CI green, API deployed |
| Sprint 2 | Core scope | Approved user stories delivered |
| Sprint 3 | Hardening and release | Tests pass, release gate approved |

## Approved scope

- A vehicle-specific, step-by-step inspection experience that enforces evidence capture on failed items and works offline.
- FastAPI endpoints and persistence necessary to store immutable inspection records, defects, and evidence metadata.
- Grounding logic that classifies critical defects, calls the grounding adapter, and drives notification fan-out with retry/fallback rules.
- Front-end UX elements (Angular/Ionic) for the guided checklist, defect capture, and grounding banner/notification status.
- **Environment variables / secrets:** define placeholders for APIM subscription (managed identity), grounding adapter endpoint, Teams webhook / Graph scopes, and Blob SAS configuration for photo uploads (photos remain in immutable storage; API stores reference URIs only).
- **Blob storage upload policy:** front-end to request upload URL via backend `POST /evidence/upload-url`, ensuring evidence immutable after inspection submission.
- **CI jobs:** extend GitHub Actions workflows to run backend pytest suite and Angular unit tests on pull requests affecting respective paths; include SQL migration lint (e.g., `alembic upgrade head --sql` dry run).
- **Checklist loading** – ensures vehicle-type filtering, regulatory category enforcement, and odometer-first rule (US‑101).
- **Inspection submission** – verifies:
- All items require pass/fail outcomes.
- Failed items require photo + ≥15-character description.
- Immutable records (attempted updates rejected).
