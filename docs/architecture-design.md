# Architecture Advisor Agent — Design-Stage Reviewable Proposal

**Project:** Fleet Inspection And Maintenance  
**Environment:** Dev  
**Date:** 2026-08-27  
**Status:** Reviewable proposal only

I treated the supplied intake documents and prior agent output as **untrusted input data** and used them to produce a design-stage architecture proposal. I am **not** asserting that any external system, repository, Azure resource, APIM policy, Foundry workflow, or fleet-management integration has been created or changed.

---

## 1. Executive summary

I recommend an architecture centered on:

- **Ionic 8 / Angular 18 client** for driver, workshop, and planner experiences
- **Python 3.12 / FastAPI services** on **Azure App Service**
- **Azure SQL Database** as the transactional system of record for inspections, defects, jobs, releases, and sync state
- **Azure Blob Storage** for immutable photographic evidence and export artifacts
- **Microsoft Entra ID** for identity, with named driver attribution
- **Microsoft Agent Framework + Foundry**, with all model traffic routed through **Azure API Management**
- **Integration adapters** for fleet vehicle status, telematics, and notifications
- **Outbox/event-driven reliability patterns** to ensure grounding, notification, and auditability are never silently lost
- **Offline-first mobile capture** with deterministic sync and idempotent server APIs

This design aligns with the stated constraints:

1. **Grounding must be authoritative and never lost**
2. **Inspection records are immutable roadworthiness evidence**
3. **Capture must work roadside with no connectivity**
4. **AI classification must be human-reviewed before taxonomy application**
5. **All model traffic must flow through APIM**

---

## 2. Architecture goals and design drivers

### Primary business drivers
- Prevent unsafe vehicles from being driven
- Reduce defect-to-workshop latency
- Maintain auditable roadworthiness evidence
- Shift servicing to usage-based scheduling
- Support unreliable connectivity in yards and roadside scenarios

### Key technical drivers
- Transactional consistency for inspection submission and grounding intent
- Strong auditability and immutability
- High resilience across integration failures
- Clear separation between authoritative records and derived projections
- Human-in-the-loop AI classification
- Mobile usability under harsh field conditions

---

## 3. Recommended target architecture

## 3.1 Logical component model

### Client applications
**Single Angular/Ionic codebase** with role-based experiences:
- **Driver mobile app**
- **Workshop tablet/web app**
- **Planner/compliance web app**

Responsibilities:
- Guided inspections
- Offline queueing and local evidence staging
- Grounding banner and trip-start gate UX
- Workshop job and release workflows
- Service/compliance views

### Core backend services
#### A. Inspection Service
Primary domain service owning:
- inspections
- inspection items
- defect records
- grounding decisions
- workshop job creation
- release-to-service workflow
- audit trail
- sync/idempotency handling

#### B. Grounding Adapter
Integration boundary to fleet management vehicle status API:
- apply grounded status
- clear grounded status on release
- retry with idempotency
- emit failure alerts/escalations

#### C. Notification Dispatcher
Handles:
- workshop controller notifications
- duty manager escalation
- fallback channels
- delivery attempt logging

#### D. Service Plan Calculator
Scheduled/domain processing for:
- odometer/engine-hour ingestion
- due-window calculations
- service compliance projections
- due notifications

#### E. Defect Classification Workflow
Agentic workflow using:
- APIM as mandatory gateway
- Foundry + Microsoft Agent Framework
- human review before taxonomy code is committed

### Data stores
- **Azure SQL Database**: transactional domain store
- **Azure Blob Storage**: evidence and immutable exports
- **Client local storage**: encrypted offline queue/cache on device

### Edge and platform services
- **Azure Front Door** for active-active routing
- **Azure App Service Premium v3** across two regions
- **APIM** for AI traffic and optionally broader API governance
- **Entra ID** for authN/authZ
- **Graph/Teams** for notifications
- **Telemetry/monitoring stack** for correlation and audit

---

## 3.2 Proposed runtime topology

### Region strategy
Use **two Azure regions** in active-active for app tier, with careful distinction between:
- **read/write transactional authority**
- **cross-region failover behavior**

### Recommendation
For Dev and likely early production hardening:
- Run **App Service active-active**
- Keep **Azure SQL with a single writable primary** and geo-replica/failover group
- Use **Blob Storage with geo-redundancy/versioning/immutability**
- Ensure clients and services tolerate transient failover

This avoids unsafe multi-write complexity for grounding and evidence records.

---

## 4. Architecture decisions

## ADR-001 — Use Azure SQL Database as the transactional system of record
**Status:** Proposed

**Decision**  
Use Azure SQL Database for inspections, defects, grounding events, workshop jobs, releases, sync state, and audit metadata.

**Rationale**
- Strong relational consistency
- Transactional submission of inspection + defect + grounding intent
- Easier enforcement of immutability and audit constraints
- Better fit for reporting and compliance joins

**Consequences**
- Need careful schema/versioning design
- Need performance tuning for evidence metadata and sync workloads
- Blob storage required for large binary evidence

---

## ADR-002 — Store photographic evidence in Azure Blob Storage with immutability controls
**Status:** Proposed

**Decision**  
Store photos and export artifacts in Blob Storage; store only references and integrity metadata in SQL.

**Rationale**
- Cost-effective binary storage
- Supports retention and immutability features
- Separates large object storage from transactional domain data

**Consequences**
- Need upload-finalization workflow
- Need hash validation and orphan cleanup
- Need legal/compliance review of retention lock settings

---

## ADR-003 — Use offline-first mobile capture with server-side idempotent sync
**Status:** Proposed

**Decision**  
Allow inspections to be fully captured offline and synchronized later using client-generated IDs and idempotency keys.

**Rationale**
- Required by roadside/yard conditions
- Prevents data loss
- Supports preserved capture timestamps

**Consequences**
- Need conflict rules
- Need local encrypted queue
- Need duplicate detection and replay-safe APIs

---

## ADR-004 — Make grounding decision synchronous in domain transaction, external fleet update asynchronous but guaranteed
**Status:** Proposed

**Decision**  
On inspection submission, the system records the authoritative internal grounding decision immediately in SQL. External fleet-management grounding is then executed through a reliable outbox/adapter process with retries and escalation.

**Rationale**
- External API failures must not erase or delay the safety decision
- Meets requirement that driver still sees “do not drive” even if integration fails
- Preserves authoritative audit trail

**Consequences**
- There may be a temporary mismatch between internal status and external fleet system
- Trip-start gate must consult authoritative internal status where possible
- Operations need reconciliation tooling

---

## ADR-005 — Use outbox pattern for grounding, notifications, and downstream events
**Status:** Proposed

**Decision**  
Persist outbound integration intents in SQL within the same transaction as the business event, then dispatch asynchronously.

**Rationale**
- Prevents lost messages
- Supports retries and observability
- Critical for grounding and notification guarantees

**Consequences**
- Requires dispatcher workers and dead-letter handling
- Requires operational dashboards

---

## ADR-006 — Human-reviewed AI classification only
**Status:** Proposed

**Decision**  
AI-generated defect taxonomy suggestions are advisory until a workshop controller reviews and confirms them.

**Rationale**
- Severity drives grounding and workflow
- Reduces risk of unsafe or incorrect automated classification
- Matches stated architecture constraint

**Consequences**
- Need review queue UX
- Need provenance of prompt, model result, reviewer decision
- Need fallback when AI unavailable

---

## ADR-007 — All model traffic routed through APIM
**Status:** Proposed

**Decision**  
All Foundry/model calls must traverse APIM with managed identity, quotas, safety policies, and correlation headers.

**Rationale**
- Central governance and observability
- Cost and abuse control
- Required by project constraints

**Consequences**
- Slight latency overhead
- APIM policy/version management required
- Need explicit deny path for direct model access

---

## ADR-008 — Immutable inspections; corrections via append-only annotations
**Status:** Proposed

**Decision**  
Once submitted, inspections and item outcomes cannot be edited in place. Any correction or contextual note is stored as a separate append-only record.

**Rationale**
- Roadworthiness evidence must be unaltered
- Strong auditability

**Consequences**
- UX must distinguish original evidence from later annotations
- Reporting must account for append-only model

---

## 5. Domain model recommendation

## 5.1 Core entities

### Identity and reference
- **Driver**
- **UserAccount**
- **RoleAssignment**
- **Vehicle**
- **VehicleType**
- **RegulatoryCategory**
- **ChecklistTemplate**
- **ChecklistTemplateVersion**
- **ChecklistItemTemplate**
- **DefectTaxonomyCode**

### Inspection domain
- **Inspection**
- **InspectionItemResult**
- **InspectionEvidence**
- **OdometerReading**
- **EngineHourReading**
- **SubmissionBatch**
- **SyncEnvelope**

### Defect and grounding domain
- **Defect**
- **DefectEvidence**
- **GroundingEvent**
- **GroundingStatusProjection**
- **GroundingIntegrationAttempt**
- **TripStartBlockDecision**

### Workshop domain
- **WorkshopJob**
- **WorkshopJobDefectLink**
- **RepairAction**
- **PartUsage**
- **ReleaseToService**
- **CompetencyAssertion**
- **PostRepairEvidence**

### Service domain
- **ServicePlan**
- **ServiceScheduleProjection**
- **UsageSnapshot**
- **ServiceDueNotification**
- **ServiceCompletion**

### Audit and integration
- **AuditEvent**
- **OutboxMessage**
- **NotificationAttempt**
- **ExternalCorrelation**
- **ClassificationReview**
- **ModelInvocationLog**

---

## 5.2 High-level relational schema guidance

### Inspection
- `inspection_id` (UUID)
- `inspection_type` (pre_trip, post_trip)
- `vehicle_id`
- `driver_id`
- `checklist_template_version_id`
- `captured_at_utc`
- `submitted_at_utc`
- `capture_mode` (online, offline)
- `sync_status`
- `odometer_value`
- `odometer_source` (telematics, manual)
- `odometer_exception_reason`
- `engine_hours_value`
- `status` (draft_local, submitted, processed)
- `immutable_hash`
- `created_by`
- `created_at_utc`

### Inspection item result
- `inspection_item_result_id`
- `inspection_id`
- `item_template_id`
- `sequence_no`
- `outcome` (pass, fail, not_applicable if allowed)
- `description`
- `requires_evidence`
- `recorded_at_utc`

### Evidence
- `evidence_id`
- `inspection_id` or `defect_id` or `release_id`
- `blob_uri`
- `blob_version_id`
- `content_hash_sha256`
- `captured_at_utc`
- `uploaded_at_utc`
- `mime_type`
- `size_bytes`
- `is_immutable_locked`

### Defect
- `defect_id`
- `inspection_id`
- `inspection_item_result_id`
- `severity` (critical, major, minor)
- `free_text_description`
- `taxonomy_code_suggested`
- `taxonomy_code_confirmed`
- `classification_status`
- `location_lat`
- `location_lon`

### Grounding event
- `grounding_event_id`
- `vehicle_id`
- `inspection_id`
- `trigger_defect_id`
- `grounding_reason`
- `grounding_status` (pending_external, applied_external, failed_external, released)
- `internal_decision_at_utc`
- `external_applied_at_utc`
- `released_at_utc`
- `idempotency_key`

### Workshop job
- `workshop_job_id`
- `vehicle_id`
- `source_defect_id`
- `status`
- `created_at_utc`
- `assigned_to`
- `priority`
- `opened_by`

### Release to service
- `release_id`
- `vehicle_id`
- `workshop_job_id`
- `released_by_user_id`
- `released_at_utc`
- `competency_basis`
- `release_notes`
- `post_repair_check_passed`

### Outbox
- `outbox_message_id`
- `aggregate_type`
- `aggregate_id`
- `event_type`
- `payload_json`
- `status`
- `attempt_count`
- `next_attempt_at_utc`
- `last_error`

---

## 6. Data lifecycle and immutability

## 6.1 Inspection evidence lifecycle
1. Driver captures photo locally
2. Photo stored in encrypted local app storage with metadata
3. On sync/submit, client uploads via pre-authorized mechanism
4. Server validates hash and associates evidence to inspection/defect
5. Inspection submission transaction finalizes immutable record
6. Blob object is placed under immutability/versioning policy
7. SQL stores content hash, blob version, and audit references

## 6.2 Immutability controls
- No update-in-place for submitted inspections
- Append-only annotations/corrections
- Blob versioning enabled
- Retention/immutability policy for evidence and exports
- Hash stored for tamper detection
- Audit event on every read of sensitive evidence export if required by policy

## 6.3 Retention
Based on intake, evidence retained for **7 years**.  
Recommendation:
- Formalize retention policy by artifact type:
  - inspections
  - evidence photos
  - repair evidence
  - notification logs
  - AI review records
  - exports
- Confirm legal hold and deletion exceptions with compliance stakeholders

---

## 7. API contract recommendations

Below are reviewable contract proposals, not implemented APIs.

## 7.1 External API style
- REST over HTTPS
- JSON payloads
- OpenAPI-first
- Versioned under `/api/v1`
- Idempotency header for write operations
- Correlation ID header on all requests
- Managed identity for service-to-service
- Entra bearer tokens for user-facing clients

### Standard headers
- `Authorization: Bearer <token>`
- `x-correlation-id`
- `x-idempotency-key`
- `x-client-captured-at`
- `If-Match` for selected concurrency-sensitive updates where applicable

---

## 7.2 Proposed core APIs

### Submit inspection
`POST /api/v1/inspections`

**Request**
```json
{
  "inspectionId": "uuid",
  "inspectionType": "pre_trip",
  "vehicleId": "VH-10234",
  "driverId": "user-123",
  "capturedAtUtc": "2026-08-27T05:58:12Z",
  "captureMode": "offline",
  "odometer": {
    "value": 182345,
    "source": "manual",
    "exceptionReason": null
  },
  "engineHours": {
    "value": 5421.4,
    "source": "telematics"
  },
  "checklistTemplateVersionId": "chk-van-uk-3",
  "items": [
    {
      "itemTemplateId": "brakes-01",
      "sequenceNo": 1,
      "outcome": "pass",
      "description": null,
      "evidence": []
    },
    {
      "itemTemplateId": "tyres-02",
      "sequenceNo": 2,
      "outcome": "fail",
      "description": "Front left tyre has exposed cord visible.",
      "evidence": [
        {
          "evidenceId": "ev-001",
          "blobTokenRef": "upload-ref-123",
          "contentHashSha256": "abc123..."
        }
      ]
    }
  ]
}
```

**Response**
```json
{
  "inspectionId": "uuid",
  "status": "submitted",
  "submittedAtUtc": "2026-08-27T06:03:01Z",
  "groundingDecision": {
    "status": "grounded",
    "reason": "critical_defect",
    "groundingEventId": "ge-123",
    "externalFleetStatus": "pending_external_apply"
  },
  "defects": [
    {
      "defectId": "df-001",
      "severity": "critical",
      "classificationStatus": "review_pending"
    }
  ]
}
```

### Get inspection
`GET /api/v1/inspections/{inspectionId}`

### Create upload session for evidence
`POST /api/v1/evidence/upload-sessions`

### Confirm uploaded evidence
`POST /api/v1/evidence/{evidenceId}/finalize`

### Get vehicle grounding status
`GET /api/v1/vehicles/{vehicleId}/grounding-status`

**Response**
```json
{
  "vehicleId": "VH-10234",
  "status": "grounded",
  "effectiveAtUtc": "2026-08-27T06:03:01Z",
  "source": "inspection_service",
  "externalFleetStatus": "pending_external_apply",
  "activeGroundingEventId": "ge-123",
  "doNotDrive": true
}
```

### Create workshop job from defect
`POST /api/v1/workshop/jobs`

### Record repair action
`POST /api/v1/workshop/jobs/{jobId}/repairs`

### Release vehicle to service
`POST /api/v1/vehicles/{vehicleId}/release-to-service`

**Request**
```json
{
  "workshopJobId": "wj-123",
  "releasedByUserId": "user-789",
  "competencyBasis": "workshop_controller_certified",
  "releaseNotes": "Brake hose replaced and pressure tested.",
  "postRepairCheckPassed": true,
  "evidence": [
    {
      "evidenceId": "ev-900",
      "blobTokenRef": "upload-ref-900",
      "contentHashSha256": "def456..."
    }
  ]
}
```

### Notification status
`GET /api/v1/notifications/{entityType}/{entityId}`

### AI classification request
Internal service-to-service:
`POST /api/v1/defects/{defectId}/classification-requests`

### AI review decision
`POST /api/v1/defects/{defectId}/classification-review`

---

## 7.3 Integration contracts

### Fleet management vehicle status API adapter contract
Internal adapter request:
```json
{
  "vehicleId": "VH-10234",
  "targetStatus": "Grounded",
  "reasonCode": "CRITICAL_DEFECT",
  "groundingEventId": "ge-123",
  "effectiveAtUtc": "2026-08-27T06:03:01Z",
  "idempotencyKey": "grounding-ge-123"
}
```

### Telematics ingestion contract
```json
{
  "vehicleId": "VH-10234",
  "observedAtUtc": "2026-08-27T05:55:00Z",
  "odometer": 182340,
  "engineHours": 5421.1,
  "sourceMessageId": "tel-555"
}
```

### Notification dispatch contract
```json
{
  "eventType": "vehicle_grounded",
  "entityId": "ge-123",
  "vehicleId": "VH-10234",
  "recipients": [
    {"role": "workshop_controller"},
    {"role": "duty_manager"}
  ],
  "channelsInPriorityOrder": ["teams", "email", "sms_or_pager"],
  "payload": {
    "severity": "critical",
    "location": {"lat": 51.5, "lon": -0.12},
    "evidenceRefs": ["ev-001"]
  }
}
```

---

## 8. Sequence flows

## 8.1 Critical defect during offline inspection
1. Driver opens cached checklist
2. Driver records failed item with photo and description
3. App determines local provisional severity only if taxonomy/rules are cached; otherwise marks for server evaluation
4. On submit offline:
   - inspection stored locally
   - local “do not drive” banner shown if critical rule can be determined locally
   - trip-start action blocked locally
5. On reconnect:
   - evidence uploads
   - inspection syncs with original capture timestamp
   - server persists inspection and defects transactionally
   - server creates grounding event
   - outbox emits:
     - fleet grounding apply
     - workshop notification
     - duty manager alert if needed
     - AI classification request if applicable
6. If external grounding fails:
   - internal status remains grounded
   - driver still sees do-not-drive
   - escalation triggered within 60 seconds target

## 8.2 Online critical defect
1. Client submits inspection
2. Server validates checklist, odometer, evidence completeness
3. SQL transaction commits:
   - inspection
   - item results
   - defect
   - grounding event
   - outbox messages
4. Response returns grounded status immediately
5. Async processors apply external grounding and notifications
6. Monitoring tracks completion/failure

## 8.3 Release to service
1. Technician completes repair record
2. Competent person reviews evidence/history
3. Release request submitted
4. SQL transaction commits release record and outbox event
5. Grounding adapter clears external grounded status
6. Vehicle status projection updated to released when successful, or pending-clear with alert if external clear fails

---

## 9. Security architecture and threat-model considerations

## 9.1 Trust boundaries
- Mobile/web client to API
- API to SQL/Blob
- API to fleet management system
- API to telematics feed
- API to Graph/Teams
- API to APIM/Foundry
- Human reviewer to AI-assisted classification workflow

All boundaries should be treated as untrusted and validated.

---

## 9.2 Key threats and mitigations

### Threat: Unauthorized submission or attribution spoofing
**Risk:** false inspections, repudiation  
**Mitigations:**
- Entra ID authentication
- Named driver sign-in on shared devices
- device compliance via Intune/conditional access
- signed tokens validated server-side
- audit of driver identity, device ID, app version, and capture timestamps

### Threat: Tampering with inspection evidence
**Risk:** invalid roadworthiness evidence  
**Mitigations:**
- append-only records
- blob immutability/versioning
- SHA-256 content hash
- no direct client overwrite of submitted evidence
- server-side evidence finalization only

### Threat: Lost grounding due to integration failure
**Risk:** unsafe vehicle remains driveable externally  
**Mitigations:**
- internal grounding decision committed transactionally
- outbox + retries
- idempotency keys
- escalation within SLA
- reconciliation dashboard

### Threat: Duplicate sync causing duplicate defects/grounding
**Risk:** inconsistent records and repeated notifications  
**Mitigations:**
- client-generated stable IDs
- idempotency keys
- unique constraints on inspection and grounding event identities
- replay-safe handlers

### Threat: Offline device compromise
**Risk:** leakage or manipulation of queued inspections/photos  
**Mitigations:**
- encrypted local storage
- minimal local retention
- MDM/Intune controls
- remote wipe where supported
- app integrity checks
- avoid storing long-lived secrets on device

### Threat: Prompt injection or malicious free-text defect content
**Risk:** AI workflow manipulation, unsafe classification  
**Mitigations:**
- treat defect text as untrusted
- constrain prompts and tool access
- no direct action from model output
- human review mandatory
- APIM content filtering and logging
- model output schema validation

### Threat: Excessive privilege in service-to-service integrations
**Risk:** lateral movement or data overreach  
**Mitigations:**
- managed identity
- least-privilege RBAC
- separate identities per service
- secretless auth where possible

### Threat: Sensitive data exposure in logs
**Risk:** privacy/compliance breach  
**Mitigations:**
- structured logging with redaction
- no photo payloads in logs
- no tokens or secrets in logs
- role-based access to diagnostics

### Threat: Export abuse
**Risk:** bulk exfiltration of compliance evidence  
**Mitigations:**
- explicit export authorization
- watermarking or audit logs
- rate limits
- scoped export jobs
- time-limited download URLs

---

## 9.3 Security requirements to formalize
- RBAC matrix by role: driver, workshop technician, workshop controller, planner, compliance manager, duty manager, admin, support
- Data classification for photos, location, driver identity, maintenance records
- Encryption at rest and in transit
- Audit retention and access policy
- Incident response for failed grounding integration
- Break-glass operational procedure

---

## 10. AI/agent architecture recommendation

## 10.1 Allowed AI use
Use AI only for:
- defect free-text classification suggestion
- taxonomy candidate ranking
- possibly summarization for controller review notes

Do **not** allow AI to:
- directly ground or release a vehicle
- directly update system-of-record status without deterministic service logic
- bypass human review for taxonomy application where severity matters

## 10.2 Proposed agent workflow
1. Inspection service sends defect text/evidence metadata to classification workflow
2. Request passes through APIM
3. Foundry/Microsoft Agent Framework returns structured suggestion:
   - candidate taxonomy codes
   - confidence
   - rationale
4. Result stored as `classification_suggested`
5. Workshop controller reviews and confirms/overrides
6. Confirmed taxonomy code becomes authoritative

## 10.3 AI governance controls
- APIM policy enforcement
- correlation IDs
- per-user or per-role quotas
- schema-constrained outputs
- prompt templates under source control
- model/version logged with each invocation
- fallback path if AI unavailable: manual classification queue

---

## 11. Non-functional architecture mapping

## Availability
- App Service active-active
- SQL failover group
- retry/circuit breaker patterns
- outbox for guaranteed eventual dispatch
- no maintenance-window assumptions

## Performance
- inspection submit API target should be defined explicitly; recommend:
  - p95 submit under 2 seconds excluding large evidence upload
  - p95 grounding decision response under 1 second after payload validation
- image upload should use chunking/resume where practical

## Reliability
- no lost submissions
- no duplicate grounding
- deterministic retries
- dead-letter handling for failed integrations

## Scalability
- stateless API instances
- background workers scale independently
- SQL indexing on vehicle/time/status
- blob offload for media

## Auditability
- immutable records
- append-only audit events
- export provenance
- reviewer attribution for release and classification

## Accessibility and field usability
- large touch targets
- one-item-per-screen inspection flow
- assertive grounding banner
- offline indicators
- low-light/high-contrast support

---

## 12. Observability and operational readiness

## 12.1 Telemetry standards
Every request/event should carry:
- `correlation_id`
- `inspection_id`
- `vehicle_id`
- `driver_id` where permitted
- `grounding_event_id`
- `outbox_message_id`
- `external_request_id`

## 12.2 Key dashboards
- inspection submissions by status
- offline queue age and sync latency
- grounding events pending external apply
- notification failures by channel
- workshop job creation latency
- release-to-service pending external clear
- AI classification queue and review turnaround
- evidence upload/finalization failures

## 12.3 Critical alerts
- grounding apply pending beyond threshold
- notification all-channels failed
- sync backlog exceeds threshold
- blob finalization/hash mismatch
- SQL failover or elevated error rate
- APIM/Foundry classification outage
- repeated odometer anomaly spikes

---

## 13. Reviewable technical implementation plan

## Phase 1 — Foundation
- Establish solution structure for Angular/Ionic + FastAPI
- Define OpenAPI contracts
- Define SQL schema v1
- Implement Entra auth integration
- Implement correlation/idempotency middleware
- Implement evidence upload/finalization pattern
- Implement audit and outbox framework

## Phase 2 — Guided inspection MVP
- Vehicle selection/scan flow
- Checklist retrieval and caching
- Odometer capture and validation
- One-item-at-a-time inspection UX
- Mandatory fail evidence
- Offline local queue
- Submit/sync APIs
- Immutable inspection persistence

## Phase 3 — Grounding and notification
- Defect creation and severity rules
- Grounding event model
- Internal trip-start gate API
- Grounding adapter with retries/idempotency
- Notification dispatcher with fallback channels
- Operational dashboards and alerts

## Phase 4 — Workshop and release
- Workshop job creation
- Defect/evidence/history view
- Repair action and parts recording
- Competent release workflow
- External grounding clear integration
- Post-repair evidence capture

## Phase 5 — Service planning and compliance
- Usage ingestion from telematics
- Service due-window calculations
- Planner/compliance views
- Export generation and audit trail

## Phase 6 — AI-assisted classification
- APIM-routed classification workflow
- structured model output contract
- controller review queue
- provenance and governance logging
- fallback manual path

## Phase 7 — Hardening
- failover testing
- offline soak testing
- security testing
- reconciliation tooling
- retention/immutability validation
- performance tuning

---

## 14. Suggested backlog for design-to-build handoff

### Architecture work items
- Produce C4 context/container/component diagrams
- Finalize ADR set
- Define trust boundaries and data classification
- Define RTO/RPO and failover runbook
- Define reconciliation process for grounding mismatches

### Data work items
- Create logical and physical data model
- Define immutability and retention policy
- Define indexing and partitioning strategy
- Define export schema for compliance evidence

### API work items
- Publish OpenAPI specs
- Define error model and status codes
- Define idempotency semantics
- Define sync protocol and evidence upload contract

### Security work items
- RBAC matrix
- threat model workshop
- conditional access and device compliance rules
- logging/redaction standards
- penetration/security test plan

### Delivery work items
- CI/CD workflow design
- environment configuration strategy
- feature flags for AI and external integrations
- test data and synthetic evidence strategy

---

## 15. Open issues and decisions needed

1. **Trip-start gate authority**
   - Which system is authoritative for blocking trip start: this solution, fleet management system, or both?
2. **Offline criticality determination**
   - Will severity rules be cached locally, or only determined server-side after sync?
3. **Vehicle assignment rules**
   - Is “vehicle not assigned to driver” a warning, approval step, or hard stop?
4. **Release competency model**
   - What qualifies a “competent person” and how is that represented in identity/roles?
5. **Notification fallback**
   - What exact fallback channels are approved beyond Teams/email?
6. **Evidence retention lock**
   - Is WORM/legal hold required, or is versioning + retention sufficient?
7. **Location data**
   - Is roadside location mandatory, optional, or consent-based?
8. **Export format**
   - PDF, CSV, JSON package, or all three?
9. **Telematics reconciliation**
   - What is the authoritative rule when manual odometer conflicts with delayed telematics?
10. **Regional data residency**
   - Any restrictions on cross-region replication for evidence or user data?

---

## 16. Recommended next-step approvals

Before implementation, I recommend human review and approval of:

- Architecture decision records
- Data model and immutability approach
- API contracts and idempotency model
- Threat model and security controls
- AI human-review workflow
- Operational reconciliation and escalation procedures

---

## 17. Proposed review outcome

**Recommendation:** **Proceed to detailed design** after stakeholder review, with special attention to:
- grounding authority and reconciliation
- offline sync semantics
- evidence immutability controls
- release-to-service authorization
- AI review governance

If useful, I can next convert this into any of the following review artifacts:

1. **ADR document set**
2. **C4 architecture diagrams in Mermaid**
3. **OpenAPI draft**
4. **SQL schema draft**
5. **Threat model table using STRIDE**
6. **Implementation work breakdown by sprint**