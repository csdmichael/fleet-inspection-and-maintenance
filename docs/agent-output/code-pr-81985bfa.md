**Code Generation Agent — Build-Stage Reviewable Proposal**  
_Project: Fleet Inspection and Maintenance · Target environment: Dev_  
_Status: Planning only — no source or environment changes have been applied._

---

### 1. Current inputs and gaps
- **Authoritative requirements:** `Fleet Inspection And Maintenance - Requirements.docx`, `...Technical Requirements.docx`, `...UX Mockups.docx`.
- **Approved artifact on record:** Requirements Agent summary (plan-stage, not an implementation baseline).
- **Repository discovery:** Source tree could not be enumerated from this environment, so file paths and framework usage in this proposal align with the documented tech stack (Angular 18/Ionic 8 front end, FastAPI 3.12 back end, Azure SQL, Blob Storage, Foundry via APIM). Please confirm or adjust once the repo layout is visible during implementation.

---

### 2. Objective of this build stage
Deliver the foundation for **FEAT-01 (Guided Vehicle Inspection)** and **FEAT-02 (Defect Grounding & Notification)** so that a driver can complete an inspection (online or offline), capture mandatory evidence, submit an immutable record, trigger authoritative grounding for critical defects, and notify workshop stakeholders with fallback handling.

---

### 3. Proposed implementation scope

#### 3.1 Data model & persistence (FastAPI + Azure SQL)
| Table | Purpose | Key fields / notes |
| --- | --- | --- |
| `inspections` | Immutable header for each inspection | `id (UUID)`, `driver_id`, `vehicle_id`, `reg_category`, `odometer_value`, `odometer_source`, `captured_at`, `submitted_at`, `submitted_by`, `offline_capture_flag`, `sync_status`, `grounding_required` |
| `inspection_items` | One-to-one with checklist entries | `inspection_id`, `sequence`, `item_code`, `prompt`, `result (PASS|FAIL)`, `failure_notes`, `evidence_blob_url`, `photo_hash` |
| `defects` | Normalised defect record powering workshop flow | `inspection_id`, `item_code`, `severity`, `description`, `taxonomy_code`, `classifier_status (pending→controller_confirmed)`, `controller_reviewed_by`, `controller_reviewed_at` |
| `grounding_events` | Authoritative grounding ledger | `vehicle_id`, `inspection_id`, `severity`, `status (pending_external, applied, failed)`, `external_reference`, `driver_alert_ticket`, `duty_manager_alert_ticket` |
| `notification_attempts` | Audit trail for US-202 fallback requirement | `grounding_event_id`, `recipient_role`, `channel`, `attempted_at`, `status`, `retry_after`, `metadata` |

Implementation steps:
- Create Alembic migration(s) with foreign keys, unique constraints to enforce immutability (e.g., disable `ON UPDATE` for inspection rows, rely on append-only `status` fields).
- Store evidence URIs referencing immutable Blob containers (use SAS-less managed identity + container-level immutability policy).
- Add triggers or stored procedures only if mandated; otherwise rely on service-layer invariants plus SQL constraints (e.g., ensure `inspection_items.result='FAIL'` implies evidence columns are non-null).

#### 3.2 FastAPI service layer
New / updated modules (paths indicative; validate against repo):
- `app/models/inspection.py` (SQLAlchemy models + Pydantic schemas; leverage `Annotated` types for stricter validation).
- `app/api/routes/inspections.py`
  - `POST /api/v1/inspections`: accepts inspection payload, validates odometer monotonicity, caches offline timestamps (`captured_at` vs `submitted_at`), persists header and line items transactionally, enqueues defect classification requests when failures exist, initiates grounding workflow for critical defects.
  - `GET /api/v1/vehicles/{vehicle_id}/grounding-status`: feeds SCR-02 banner and prevents trip start.
- `app/services/grounding.py`: orchestrates Azure SQL transaction + call to Grounding Adapter (retry w/ exponential back-off, idempotency key = inspection_id + vehicle_id).
- `app/services/notifications.py`: interface to notification dispatcher (Graph mail, Teams). Implements ordered channel fallback, logs to `notification_attempts`.
- `app/services/defect_classifier.py`: calls Foundry via APIM with managed identity, applies content safety headers, stores classifier response for controller review.
- `app/background/workers.py`: background tasks for retrying failed grounding or notifications (FastAPI `BackgroundTasks` or Celery/Resilient job runner if present).

Key behaviors:
- **Offline sync**: request payload includes `captured_at` from the device; API preserves it even if `submitted_at` is hours later.
- **Immutability**: once stored, inspections cannot be edited—only appended status (e.g., `sync_status` transitions) allowed.
- **Grounding fallback**: if fleet system call fails, system still marks vehicle as “pending grounding” locally, pushes urgent notification to duty manager within 60 seconds, and denies trip-start API for that vehicle until manual override.

#### 3.3 Angular/Ionic client
Target screens: SCR-01 Guided Inspection, SCR-02 Defect & Grounding.

Proposed structure (adjust path naming to repo conventions):
- `src/app/core/models/inspection.model.ts`: typed models mirroring API schema, including `InspectionDraft`, `InspectionSubmission`, `Defect`, `GroundingState`.
- `src/app/core/services/inspection.service.ts`: wraps API calls, includes retry policies, offline queue operations.
- `src/app/core/services/offline-sync.service.ts`: IndexedDB (via `@ngx-pwa/local-storage` or Ionic Storage) to queue submissions with evidence blobs; handles replay within five minutes of connectivity restoration.
- Components:
  - `InspectionWizardComponent` (route `/inspection/start`): orchestrates steps (vehicle selection/scan, odometer entry, item-by-item evaluation).
  - `ChecklistItemComponent`: enforces one-item-at-a-time UI, evidence capture gating for failures.
  - `EvidenceCaptureComponent`: integrates Capacitor Camera; enforces min description length, shows guidance before capture per UX spec.
  - `GroundingBannerComponent`: persists at top-level layout when `GroundingState.status !== 'cleared'`.
  - `NotificationStatusComponent`: shows recipients w/ live updates (polite aria-live region).
- Offline UX: show queued state chip, disable duplicate submissions, expose manual sync trigger.
- Accessibility: assertive focus management when grounding occurs; large touch targets per persona constraints.

#### 3.4 Integration adapters
- **Blob Storage uploader** (frontend + backend):
  - Frontend captures photo, compresses if necessary, uploads via pre-signed SAS or direct call to API that stores via managed identity.
  - Backend validates MIME type, stores `sha256` hash, ensures immutability container policy is applied.
- **Foundry classifier**:
  - Implement API client using azure-identity credentials; include correlation headers demanded by APIM.
  - Support controller review queue (persist classifier suggestions, mark pending until human approval).

---

### 4. File-by-file change outline (subject to repo confirmation)

| Area | Files (indicative) | High-level change |
| --- | --- | --- |
| Database | `alembic/versions/2024xxxx_create_inspection_tables.py` | Introduce inspection/defect/grounding schemas with indexes & constraints. |
| Models/Schemas | `app/models/*.py`, `app/schemas/*.py` | Define SQLAlchemy + Pydantic models for new tables; include enumerations for severity, status, notification channels. |
| Routes | `app/api/routes/inspections.py`, `app/api/routes/vehicles.py` | Add POST/GET endpoints, data validation, offline submission handling, error responses per NFRs. |
| Services | `app/services/grounding.py`, `.../notifications.py`, `.../defect_classifier.py` | Implement orchestration logic, integrate with external adapters, log attempts. |
| Background workers | `app/background/tasks.py` | Retry grounding/notification failures; ensure idempotency and alerting. |
| Client models | `src/app/core/models/inspection.model.ts` | Mirror backend schemas for type safety. |
| Client services | `src/app/core/services/inspection.service.ts`, `offline-sync.service.ts`, `grounding.service.ts` | API integration, offline queue, background sync, SSE/SignalR subscriptions if available. |
| Client store/state | `src/app/state/inspection/*` | Actions/effects/selectors for inspection flow and grounding state (use existing NgRx or signals). |
| UI components | `src/app/pages/inspection/*`, `components/grounding-banner`, `components/notification-status` | Build guided checklist UI, evidence capture, grounding banner and notification log per UX SCR-01/02. |
| Assets/config | `src/theme/variables.scss`, `i18n/en.json` | Add strings for do-not-drive messaging, error states, accessibility cues. |
| Tests (backend) | `tests/api/test_inspections.py`, `tests/services/test_grounding.py`, `tests/services/test_notifications.py` | Unit + integration tests using pytest + FastAPI TestClient, with mocks for external systems. |
| Tests (frontend) | `src/app/pages/inspection/*.spec.ts`, `services/*.spec.ts` | Component tests verifying evidence gating, offline queue logic, grounding banner persistence. |

---

### 5. Testing & quality strategy
| Layer | Tests | Notes |
| --- | --- | --- |
| Database | Alembic migration smoke + rollback test in CI | Validate schema builds cleanly on empty Dev DB. |
| API validation | Pytest parameterized cases for odometer monotonicity, required evidence, offline capture fields | Mock Blob + Foundry clients to avoid external calls. |
| Grounding flow | Service tests verifying: success path, fleet system failure fallback, notification escalation logging | Include time-bound assertions (duty manager alert <60s). |
| Notification fallback | Simulate Graph failure -> Teams fallback -> escalation | Ensure `notification_attempts` contains chronological log. |
| Offline sync | Unit tests for `offline-sync.service` (IndexedDB queue) plus Cypress/e2e scenario toggling network state | Confirm inspection remains queued with original timestamp. |
| UI/UX | Component tests for checklist progression, evidence gating, grounding banner persistence, accessibility assertions (aria-live, focus) | Align with UX SCR-01/SCR-02 requirements. |
| Contract tests | Schema snapshot or OpenAPI diff to ensure clients & API stay in sync | Required before promoting to higher env. |

Performance/security checks:
- Validate photo upload size limits and MIME sniffing to prevent malicious payloads.
- Ensure API enforces driver identity via Entra ID token claims; log each submission for audit.

---

### 6. Risks, assumptions, and dependencies
1. **Repository structure unknown** – paths assumed; confirm before implementation.
2. **Checklist source & caching** – proposal assumes preloaded checklist definitions per vehicle type (likely stored in SQL or static JSON). Need confirmation.
3. **Notification dispatcher availability** – require existing abstraction to MS Graph/Teams; if absent, need additional design.
4. **Offline evidence storage** – storing photos before connectivity may require temporary device storage quotas; confirm compliance policy.
5. **Grounding adapter contract** – need idempotency semantics and retry limits; coordinate with Integration Platform team.
6. **Controller review workflow** – classification confirms require UI/service components not detailed in UX excerpt (document truncated). Additional requirements may surface.

---

### 7. Approvals sought
- Acceptance of proposed DB schema changes and immutability strategy.
- Confirmation that requirements summary is sufficient as “approved design” for this stage or identification of additional design artifacts.
- Agreement on Angular/Ionic offline approach (IndexedDB + background sync) and FastAPI service boundaries.
- Validation of integration contracts with Grounding Adapter, Notification dispatcher, and Foundry/APIM.

Once approved, the next step is to create the detailed change list/PR(s) implementing the above, with traceable commits and the outlined tests.

---

Please review and provide approval, corrections, or additional constraints so we can proceed to implementation.