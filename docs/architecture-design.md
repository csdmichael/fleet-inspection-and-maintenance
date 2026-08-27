# Architecture Advisor Agent — Design-Stage Reviewable Proposal

**Project:** Fleet Inspection And Maintenance  
**Target environment:** Dev  
**Status:** Reviewable proposal only; no implementation or external-system changes performed  
**Date:** 2026-08-27

## 1. Executive summary

This proposal translates the supplied requirements, technical constraints, UX pack, and approved requirements-stage artifact into a design-stage architecture recommendation for review.

### Recommended architecture
A **mobile-first, offline-capable inspection platform** with:

- **Angular 18 + Ionic 8** client for driver handheld, workshop tablet, and planner web views
- **Python 3.12 + FastAPI** backend on **Azure App Service**
- **Azure SQL Database** as the transactional system of record for inspections, defects, jobs, releases, and audit events
- **Azure Blob Storage** for immutable photographic evidence
- **Microsoft Entra ID** for user identity
- **Azure API Management** as the mandatory gateway for all model traffic
- **Microsoft Foundry + Microsoft Agent Framework** for defect classification workflow with **human review before taxonomy application**
- **Integration adapters** for fleet management grounding, telematics, and notifications
- **Azure Functions** for service-plan projection and scheduled processing
- **Azure Front Door** and active-active App Service deployment across two regions, per stated constraint

### Core design principles
1. **Grounding is safety-critical and authoritative**
2. **Inspection evidence is immutable**
3. **Offline capture must not lose records**
4. **Trip start must be blocked for grounded vehicles**
5. **AI output is advisory until human-confirmed where it affects severity/taxonomy**
6. **All external calls are idempotent, observable, and retry-safe**
7. **Every safety-relevant action is auditable**

---

## 2. Inputs used

This proposal is based on the supplied intake documents and approved artifact:

- Requirements document
- Technical requirements and architecture constraints
- UX mockups and interaction specification
- Approved requirements-agent summary

### Qualification
The source documents are marked **Draft**, and some supplied text is truncated. Therefore:

- this is a **candidate architecture baseline**
- some details are marked **Proposed / confirm**
- implementation should not begin until human review approves this design and resolves open questions

---

## 3. Architecture scope

## In scope
- Guided pre-trip and post-trip inspections
- Vehicle-specific checklist retrieval and rendering
- Odometer and engine-hour capture
- Defect capture with photo evidence
- Critical-defect grounding workflow
- Driver do-not-drive experience
- Workshop notification and job creation
- Repair recording and release-to-service workflow
- Usage-based service planning
- Compliance evidence export
- Offline-first mobile capture and sync
- Defect classification workflow through Foundry via APIM
- Audit, retention, and immutable evidence controls

## Out of scope
Per supplied requirements:
- route planning and dispatch
- fuel/toll domains
- driver licensing/medical/HOS compliance
- procurement/leasing/disposal
- new analytics beyond existing dashboards

---

## 4. Proposed logical architecture

## 4.1 Context view

```text
Driver Handheld / Workshop Tablet / Planner Browser
                |
                v
      Angular + Ionic Client
                |
                v
         Azure Front Door
                |
                v
     FastAPI Inspection Platform
   --------------------------------
   | Inspection API               |
   | Defect / Grounding Service   |
   | Workshop Job Service         |
   | Release-to-Service Service   |
   | Notification Orchestrator    |
   | Sync API                     |
   | Evidence API                 |
   | Audit API                    |
   --------------------------------
      |         |         |        \
      |         |         |         \
      v         v         v          v
 Azure SQL   Blob      APIM       External Integrations
 Database    Storage   -> Foundry  - Fleet Mgmt Status API
                        + MAF       - Telematics
                                    - Graph / Teams / Mail
                                    
Scheduled / async:
- Azure Functions for service-plan calculation
- Background workers for retries, notifications, reconciliation
```

## 4.2 Deployment view

**Recommended deployment units**
- **Client app**: Ionic/Angular packaged for Android handhelds and browser/tablet use
- **API app**: FastAPI on Azure App Service
- **Worker app**: FastAPI background worker or Azure Functions for async processing
- **Service-plan function**: Azure Functions scheduled jobs
- **SQL database**
- **Blob storage**
- **APIM**
- **Foundry project / agent workflow**
- **Monitoring stack**: Azure Monitor / Application Insights / Log Analytics

---

## 5. Component architecture

## 5.1 Front-end application
**Responsibilities**
- vehicle selection/scan
- checklist rendering
- odometer capture
- fail evidence capture
- offline queueing
- sync status
- grounding banner and do-not-drive state
- workshop and planner views
- accessibility behaviors from UX spec

**Design recommendation**
Use a **single Angular/Ionic codebase** with role-based route segmentation:
- `/driver`
- `/workshop`
- `/planner`
- `/compliance`

**Offline design**
Use local encrypted storage for:
- cached checklist definitions
- pending inspections
- pending evidence metadata
- sync journal
- last-known grounding state for viewed vehicles where relevant

**Important constraint**
The client may display “do not drive” immediately based on local submission outcome, but **authoritative grounding state** is owned by backend + fleet management integration.

---

## 5.2 Inspection service
**Responsibilities**
- create inspection session
- validate vehicle/checklist applicability
- validate odometer rules
- accept immutable inspection submission
- derive defects from failed items
- invoke grounding rules
- persist audit trail
- initiate notifications and classification workflow

**Design recommendation**
Model inspection submission as a **single transactional command**:
`SubmitInspection`

Within one database transaction:
- persist inspection header
- persist item outcomes
- persist defect records
- determine grounding-required flag
- create grounding event record
- create outbox messages for async downstream actions

This supports atomicity between inspection evidence and grounding intent.

---

## 5.3 Grounding adapter
**Responsibilities**
- apply grounded status to fleet management system
- clear grounded status on approved release
- enforce idempotency
- retry failures
- raise alerts on failure

**Design recommendation**
Implement as a separate integration boundary with:
- idempotency key per grounding/release event
- durable retry policy
- dead-letter/manual resolution state
- explicit status model:
  - `Pending`
  - `Applied`
  - `FailedRetrying`
  - `ManualResolutionRequired`
  - `Cleared`

**Safety rule**
If external grounding application fails:
- backend still records the vehicle as **locally unsafe / do-not-drive**
- driver sees do-not-drive message
- duty manager alerted within required SLA
- trip-start authorization must deny use while grounding is unresolved

---

## 5.4 Workshop job service
**Responsibilities**
- create workshop jobs from defects
- attach evidence and history
- record diagnosis, repair, parts, labor
- track job lifecycle
- support release handoff

**Recommended states**
- `New`
- `Acknowledged`
- `InDiagnosis`
- `AwaitingParts`
- `InRepair`
- `RepairCompleted`
- `AwaitingRelease`
- `Closed`

---

## 5.5 Release-to-service service
**Responsibilities**
- record competent-person review
- verify required repair evidence
- clear local grounded state
- trigger fleet management release
- produce release audit record

**Safety rule**
A vehicle cannot return to service unless:
- all grounding defects are resolved or explicitly dispositioned
- release is performed by authorized role
- release record is immutable
- external release call is confirmed or placed into tracked retry/manual resolution flow

---

## 5.6 Service plan calculator
**Responsibilities**
- consume odometer/engine-hour readings
- project next service due window
- generate due/overdue notifications
- support compliance reporting

**Recommended hosting**
Azure Functions on schedule and/or event trigger.

---

## 5.7 Defect classification workflow
**Responsibilities**
- classify free-text defect descriptions into standard taxonomy
- provide confidence and rationale metadata
- pause for workshop controller review
- only apply taxonomy code after human confirmation

**Required path**
Inspection service -> APIM -> Foundry / Microsoft Agent Framework

**Governance**
- no direct model calls from client
- no direct model calls bypassing APIM
- classification output stored as:
  - proposed code
  - confidence
  - model metadata
  - reviewer decision
  - final applied code

---

## 6. Key architecture decisions

## ADR-001 — Use Azure SQL as transactional system of record
**Status:** Proposed  
**Decision:** Use Azure SQL Database for inspections, defects, jobs, releases, grounding events, and audit metadata.  
**Rationale:** The domain is relational and requires transactional consistency between inspection submission and grounding intent.  
**Consequences:** Strong consistency and queryability; requires schema design for scale and retention.

## ADR-002 — Use Blob Storage for immutable evidence
**Status:** Proposed  
**Decision:** Store photos and post-repair evidence in Azure Blob Storage with immutability controls after submission.  
**Rationale:** 7-year retention and unaltered evidence requirement.  
**Consequences:** Need upload token flow, retention policy, hash verification, and evidence-reference model in SQL.

## ADR-003 — Use outbox pattern for external side effects
**Status:** Proposed  
**Decision:** Persist outbound integration events in the same transaction as inspection submission.  
**Rationale:** Prevent loss of grounding/notification/classification intents.  
**Consequences:** Requires worker processing and replay-safe consumers.

## ADR-004 — Offline-first client with deferred synchronization
**Status:** Proposed  
**Decision:** Allow inspection capture offline and sync later with preserved capture timestamp.  
**Rationale:** Yard/roadside dead zones are a core requirement.  
**Consequences:** Need conflict rules, local encryption, sync journal, and evidence upload resume behavior.

## ADR-005 — Human-in-the-loop AI classification
**Status:** Proposed  
**Decision:** AI classification is advisory until controller review confirms taxonomy.  
**Rationale:** Taxonomy may influence severity and workflow; technical requirements explicitly require review.  
**Consequences:** Additional review UI and state transitions.

## ADR-006 — Separate grounding adapter from core inspection service
**Status:** Proposed  
**Decision:** Isolate fleet management grounding integration behind an adapter boundary.  
**Rationale:** Safety-critical integration with retries, idempotency, and manual resolution needs.  
**Consequences:** More components, but clearer ownership and resilience.

## ADR-007 — Immutable submitted inspections
**Status:** Proposed  
**Decision:** Submitted inspections cannot be edited; corrections are additive via superseding records or annotations.  
**Rationale:** Roadworthiness evidence must be immutable.  
**Consequences:** Need correction model rather than update-in-place.

## ADR-008 — APIM as mandatory AI gateway
**Status:** Proposed  
**Decision:** All model traffic routes through Azure API Management with managed identity, quotas, safety, and correlation.  
**Rationale:** Stated platform constraint and governance requirement.  
**Consequences:** Need APIM policies and observability.

---

## 7. Domain model recommendation

## 7.1 Core entities

### Vehicle
- `vehicleId`
- `registrationNumber`
- `vehicleType`
- `regulatoryCategory`
- `status` (`Available`, `Grounded`, `InWorkshop`, `ReleasedPendingSync`, etc.)
- `lastKnownOdometer`
- `lastKnownEngineHours`

### Driver
- `driverId`
- `displayName`
- `entraObjectId`
- `roleSet`
- `deviceComplianceState`

### Inspection
- `inspectionId`
- `vehicleId`
- `driverId`
- `inspectionType` (`PreTrip`, `PostTrip`)
- `checklistVersionId`
- `captureStartedAt`
- `submittedAt`
- `capturedOffline`
- `syncReceivedAt`
- `odometerValue`
- `odometerSource` (`Telematics`, `DriverEntered`)
- `engineHoursValue`
- `status` (`DraftLocal`, `Submitted`, `Processed`)
- `immutableHash`

### InspectionItemResult
- `inspectionItemResultId`
- `inspectionId`
- `itemCode`
- `itemText`
- `sequence`
- `outcome` (`Pass`, `Fail`, `NotApplicable?` confirm)
- `description`
- `requiresEvidence`
- `capturedAt`

### EvidenceAsset
- `evidenceAssetId`
- `inspectionId`
- `defectId` nullable
- `blobUri`
- `contentHash`
- `mimeType`
- `capturedAt`
- `uploadedAt`
- `immutabilityPolicyRef`

### Defect
- `defectId`
- `inspectionId`
- `inspectionItemResultId`
- `severity` (`Minor`, `Major`, `Critical`) confirm taxonomy
- `description`
- `location`
- `status` (`Open`, `Grounding`, `InRepair`, `Resolved`, `Closed`)
- `taxonomyCodeProposed`
- `taxonomyCodeFinal`
- `classificationReviewStatus`

### GroundingEvent
- `groundingEventId`
- `vehicleId`
- `inspectionId`
- `triggerDefectId`
- `groundingReason`
- `status`
- `externalIdempotencyKey`
- `requestedAt`
- `appliedAt`
- `resolvedAt`
- `manualResolutionFlag`

### WorkshopJob
- `jobId`
- `vehicleId`
- `sourceDefectId`
- `createdAt`
- `status`
- `assignedTo`
- `diagnosis`
- `repairSummary`

### RepairAction
- `repairActionId`
- `jobId`
- `performedBy`
- `performedAt`
- `actionType`
- `notes`

### PartUsage
- `partUsageId`
- `jobId`
- `partNumber`
- `description`
- `quantity`

### ReleaseRecord
- `releaseId`
- `vehicleId`
- `jobId`
- `releasedBy`
- `releasedAt`
- `releaseDecision`
- `releaseNotes`
- `externalClearanceStatus`

### NotificationAttempt
- `notificationAttemptId`
- `eventType`
- `recipient`
- `channel`
- `attemptedAt`
- `outcome`
- `fallbackSequence`
- `correlationId`

### AuditEvent
- `auditEventId`
- `aggregateType`
- `aggregateId`
- `eventType`
- `actorId`
- `occurredAt`
- `payloadHash`
- `correlationId`

---

## 8. Data architecture and storage design

## 8.1 Azure SQL
Use SQL for:
- inspections
- item results
- defects
- grounding events
- workshop jobs
- releases
- notifications
- audit metadata
- sync journal
- outbox/inbox tables

### Recommended patterns
- rowversion/concurrency token where mutable records exist
- append-only audit/event tables
- partitioning or archival strategy for long retention
- encrypted columns for sensitive fields where needed
- strict foreign keys for evidence traceability

## 8.2 Blob storage
Use Blob for:
- defect photos
- post-repair evidence
- exported compliance bundles if needed

### Recommended controls
- immutable blob policy after successful submission
- content hash stored in SQL
- malware scanning pipeline if available/approved
- private containers only
- time-limited upload SAS or backend-mediated upload
- no public URLs

## 8.3 Retention
Based on supplied requirement:
- roadworthiness evidence retained for **7 years**

**Proposed retention policy**
- SQL operational data retained online per performance needs
- evidence and audit records retained 7 years minimum
- archival/export strategy defined before production

---

## 9. API contract recommendations

## 9.1 API style
- REST over HTTPS
- JSON payloads
- versioned endpoints: `/api/v1/...`
- idempotency support for submission and external side effects
- correlation ID on every request
- RFC7807-style problem details for errors

## 9.2 Core internal API surface

### Start inspection
`POST /api/v1/inspections/start`

Request:
```json
{
  "vehicleId": "VH-1024",
  "inspectionType": "PreTrip",
  "driverId": "DRV-778",
  "clientTimestamp": "2026-08-27T06:02:11Z"
}
```

Response:
```json
{
  "inspectionSessionId": "INS-SESSION-123",
  "vehicle": {
    "vehicleId": "VH-1024",
    "vehicleType": "RigidTruck",
    "regulatoryCategory": "HGV"
  },
  "odometer": {
    "prefillValue": 182334,
    "source": "Telematics",
    "minimumAllowed": 182300
  },
  "checklistVersion": {
    "checklistVersionId": "CHK-44",
    "items": [
      {
        "itemCode": "BRAKES",
        "sequence": 1,
        "text": "Check brake operation"
      }
    ]
  }
}
```

### Submit inspection
`POST /api/v1/inspections`

Headers:
- `Idempotency-Key`
- `X-Correlation-Id`

Request:
```json
{
  "inspectionSessionId": "INS-SESSION-123",
  "vehicleId": "VH-1024",
  "driverId": "DRV-778",
  "inspectionType": "PreTrip",
  "captureStartedAt": "2026-08-27T06:02:11Z",
  "submittedAtClient": "2026-08-27T06:08:41Z",
  "capturedOffline": true,
  "odometer": {
    "value": 182334,
    "source": "DriverEntered",
    "explanation": null
  },
  "items": [
    {
      "itemCode": "BRAKES",
      "outcome": "Fail",
      "description": "Brake pedal feels soft and travel is excessive",
      "evidence": [
        {
          "uploadToken": "token-ref-1",
          "contentHash": "sha256-abc"
        }
      ]
    }
  ]
}
```

Response:
```json
{
  "inspectionId": "INS-90001",
  "status": "Submitted",
  "grounding": {
    "required": true,
    "status": "PendingExternalApply",
    "driverInstruction": "DO NOT DRIVE THIS VEHICLE"
  },
  "defects": [
    {
      "defectId": "DEF-1001",
      "severity": "Critical",
      "classificationStatus": "PendingReview"
    }
  ],
  "sync": {
    "acceptedAt": "2026-08-27T06:09:02Z"
  }
}
```

### Get grounding status
`GET /api/v1/vehicles/{vehicleId}/grounding-status`

Response:
```json
{
  "vehicleId": "VH-1024",
  "status": "Grounded",
  "sourceOfTruth": "InspectionPlatform",
  "externalFleetStatus": "PendingConfirmation",
  "activeGroundingEventId": "GRD-2001",
  "message": "DO NOT DRIVE THIS VEHICLE"
}
```

### Create workshop job from defect
`POST /api/v1/workshop/jobs`

```json
{
  "defectId": "DEF-1001",
  "requestedBy": "system"
}
```

### Record repair
`POST /api/v1/workshop/jobs/{jobId}/repair-actions`

### Release to service
`POST /api/v1/vehicles/{vehicleId}/release`

```json
{
  "jobId": "JOB-2001",
  "releasedBy": "USR-900",
  "releaseNotes": "Brake line replaced and tested",
  "evidence": [
    {
      "uploadToken": "token-ref-2",
      "contentHash": "sha256-def"
    }
  ]
}
```

### Sync pending offline submissions
`POST /api/v1/sync/inspections/batch`

Supports batch replay from mobile client.

---

## 10. External integration contracts

## 10.1 Fleet management vehicle status API
**Purpose:** apply/clear grounded status

**Contract recommendations**
- use idempotency key per grounding event
- include vehicle ID, status, reason, timestamp, correlation ID
- timeout at 3 seconds per supplied requirement
- retry with exponential backoff and durable queue
- store request/response metadata for audit

**Example outbound payload**
```json
{
  "vehicleId": "VH-1024",
  "status": "Grounded",
  "reasonCode": "CRITICAL_DEFECT",
  "reasonReference": "GRD-2001",
  "effectiveAt": "2026-08-27T06:09:02Z",
  "correlationId": "c9f0..."
}
```

## 10.2 Telematics feed
**Purpose:** odometer/engine-hour prefill and service planning

**Design recommendation**
- maintain latest reading cache per vehicle
- mark source and timestamp
- if stale beyond tolerance, require driver entry and flag as manual
- reconcile later if telematics recovers

## 10.3 Notifications via Graph / Teams / Mail
**Purpose:** workshop controller and duty manager alerts

**Design recommendation**
- notification policy table with escalation order
- log every attempt
- fallback channels
- page duty manager if all fail within 5 minutes

## 10.4 Foundry via APIM
**Purpose:** defect taxonomy classification

**Design recommendation**
- APIM injects correlation headers
- managed identity auth
- content safety policy
- per-user quotas
- request/response logging with redaction
- no direct client access

---

## 11. Sequence flows

## 11.1 Critical defect submission flow
1. Driver completes checklist and submits inspection
2. Client sends inspection with idempotency key
3. API validates payload and evidence references
4. SQL transaction persists inspection, items, defects, grounding event, outbox messages
5. API returns accepted response with do-not-drive instruction
6. Worker processes grounding outbox event
7. Grounding adapter calls fleet management API
8. Notification workflow alerts workshop controller and duty manager
9. Classification workflow sends defect text through APIM to Foundry
10. Controller reviews proposed taxonomy
11. Workshop job created and tracked

## 11.2 Offline submission flow
1. Driver completes inspection offline
2. Client stores inspection package locally with capture timestamps
3. Client displays queued state
4. Connectivity returns
5. Client uploads evidence and submits inspection batch
6. Server deduplicates via idempotency key/client submission ID
7. Server preserves original capture time and records sync receipt time
8. Driver sees final accepted/grounded state

## 11.3 Release-to-service flow
1. Technician completes repair
2. Competent person reviews job and evidence
3. Release record submitted
4. SQL transaction records immutable release and outbox event
5. Grounding adapter clears external grounded status
6. Vehicle status becomes releasable only after successful or tracked pending-clear state per approved business rule
7. Audit trail finalized

---

## 12. Non-functional design response

## Availability
Requirement indicates active-active across two regions behind Front Door.

**Recommendation**
- deploy App Service in two regions
- Front Door health probes and failover
- SQL high availability configured appropriately
- background workers deployed in paired regions with leader/lease control where needed

## Performance
**Targets proposed from UX/requirements**
- checklist load: < 2 seconds on warm path
- inspection submit acknowledgment: < 3 seconds nominal online
- grounding alert to duty manager: within 60 seconds on integration failure
- workshop notification: within 5 minutes max
- sync after reconnection: within 5 minutes under normal backlog

## Reliability
- outbox pattern for all side effects
- idempotent submission
- resumable evidence upload
- retry with poison/dead-letter handling
- reconciliation jobs for grounding and notification drift

## Security
- Entra ID authentication
- conditional access with Intune-compliant device
- RBAC by role
- managed identity for service-to-service
- encryption in transit and at rest
- immutable evidence
- audit logging

## Accessibility
Derived from UX pack:
- assertive announcement for grounding banner
- no color-only severity communication
- explicit labels for pass/fail
- numeric keyboard hint for odometer
- live region updates for notification status

## Auditability
- immutable inspections and releases
- append-only audit events
- correlation IDs across all services
- evidence hash verification
- actor attribution for every user action

---

## 13. Threat model considerations

## 13.1 Assets
- inspection evidence
- grounding status
- release-to-service decisions
- driver identity attribution
- defect photos
- service compliance records
- AI classification outputs and review decisions

## 13.2 Trust boundaries
- mobile device to API
- API to SQL/blob
- API to external fleet management
- API/worker to Graph/Teams
- APIM to Foundry
- offline local storage on handheld device

## 13.3 Key threats and mitigations

### T1. Lost or duplicated offline submissions
**Risk:** missing or duplicate inspections  
**Mitigations:**
- client-generated submission ID
- idempotency keys
- sync journal
- server dedupe rules
- immutable accepted records

### T2. Tampering with evidence before upload
**Risk:** altered roadworthiness evidence  
**Mitigations:**
- content hash on client and server
- immutable blob after submission
- timestamp preservation
- signed upload flow
- audit event on upload completion

### T3. Unauthorized release to service
**Risk:** unsafe vehicle returned to operation  
**Mitigations:**
- role-based authorization
- step-up auth if required for release
- release requires named competent person
- immutable release record
- dual-control option as future enhancement if policy requires

### T4. Grounding integration failure
**Risk:** vehicle appears drivable in external system  
**Mitigations:**
- local authoritative do-not-drive state
- trip-start deny while unresolved
- alert duty manager within 60 seconds
- durable retries
- reconciliation dashboard

### T5. AI misclassification
**Risk:** incorrect taxonomy/severity routing  
**Mitigations:**
- human review before final taxonomy application
- confidence capture
- no autonomous severity override without approved policy
- APIM safety and logging

### T6. Device compromise or shared-device misuse
**Risk:** false attribution or data leakage  
**Mitigations:**
- Entra sign-in per driver
- Intune compliance
- local encrypted storage
- session timeout
- wipe on sign-out for shared-device local data where feasible

### T7. Broken access control
**Risk:** drivers viewing workshop-only or compliance data  
**Mitigations:**
- backend-enforced RBAC
- route guards are not sufficient alone
- row/record scoping where needed
- audit access to sensitive records

### T8. Sensitive data leakage in logs
**Risk:** evidence or personal data exposed  
**Mitigations:**
- structured logging with redaction
- no photo blobs in logs
- APIM and app telemetry scrubbing
- least-privilege access to monitoring

---

## 14. Security and compliance recommendations

- Use **managed identities** for all Azure service access
- Store secrets only in **Key Vault** if any are unavoidable
- Enforce **private endpoints** where feasible in later environments
- Use **RBAC roles** such as:
  - Driver
  - Workshop Technician
  - Workshop Controller
  - Duty Manager
  - Fleet Planner
  - Compliance Manager
  - System Administrator
- Apply **blob immutability policy**
- Enable **SQL auditing** and threat detection if available
- Ensure **PII minimization** in model prompts and logs
- Add **content safety** and prompt/response filtering in APIM path
- Preserve **chain of custody** for evidence through hashes and audit events

---

## 15. Observability and operational design

## Required telemetry
- request latency and error rate
- inspection submission success/failure
- offline sync backlog
- grounding event lifecycle
- external fleet API failures
- notification delivery attempts
- classification workflow latency and review outcomes
- evidence upload failures
- release-to-service actions
- reconciliation mismatches

## Key dashboards
1. **Safety dashboard**
   - active grounded vehicles
   - unresolved grounding failures
   - vehicles blocked from trip start

2. **Operations dashboard**
   - defect-to-job elapsed time
   - notification SLA compliance
   - sync backlog by device/site

3. **Compliance dashboard**
   - inspection completeness
   - evidence retention status
   - service due-window compliance

4. **AI governance dashboard**
   - classification volume
   - confidence distribution
   - human override rate
   - APIM quota/cost metrics

## Alerting recommendations
- grounding apply failure > 60 seconds
- notification all-channel failure
- sync backlog over threshold
- evidence upload integrity mismatch
- release attempted by unauthorized role
- APIM/Foundry timeout spike

---

## 16. Implementable technical plan

## Phase 1 — Foundation
- establish repo structure and environments
- define SQL schema baseline
- define API contracts and OpenAPI
- implement Entra auth and RBAC
- configure Blob storage and evidence upload flow
- configure APIM baseline for model traffic
- set up App Insights / logging / correlation IDs

## Phase 2 — Guided inspection MVP
- vehicle selection and checklist retrieval
- odometer validation
- one-item-at-a-time inspection UI
- fail evidence capture
- immutable inspection submission
- offline local queue and sync
- audit event creation

## Phase 3 — Grounding and notifications
- defect derivation and severity rules
- grounding event model
- grounding adapter with idempotent external calls
- do-not-drive UX
- workshop/duty manager notification orchestration
- failure escalation and retry handling

## Phase 4 — Workshop and release
- workshop job creation and lifecycle
- repair and parts recording
- release-to-service authorization and workflow
- external grounding clear integration
- release audit and evidence

## Phase 5 — Service planning and compliance
- telematics ingestion/cache
- service-plan calculator
- due-window notifications
- compliance export package
- reporting endpoints

## Phase 6 — AI-assisted classification
- APIM policies for model route
- Foundry agent workflow integration
- controller review UI
- taxonomy application and audit trail
- governance metrics

## Phase 7 — Hardening
- failover testing
- offline chaos testing
- reconciliation jobs
- penetration/security review
- retention and archival validation
- performance and accessibility validation

---

## 17. Suggested work breakdown by engineering stream

## Front-end
- shared app shell and role routing
- driver inspection flow
- offline storage/sync engine
- grounding banner UX
- workshop job UI
- release UI
- planner/compliance views

## Backend/API
- inspection domain
- defect/grounding domain
- workshop domain
- release domain
- sync endpoints
- audit/eventing
- evidence token service

## Integration
- fleet management adapter
- telematics adapter
- Graph/Teams/mail dispatcher
- reconciliation jobs

## Data
- SQL schema
- retention strategy
- reporting views
- export model

## AI/Platform
- APIM route and policies
- Foundry workflow
- prompt contract
- review-state persistence
- governance telemetry

## DevOps
- GitHub Actions
- IaC templates
- environment protection
- monitoring/alerts
- active-active deployment automation

---

## 18. Review gates and acceptance criteria for design approval

This architecture should be approved only after confirmation of:

1. **Grounding source of truth**
   - Is local platform state sufficient to block trip start before external fleet status confirms?

2. **Severity model**
   - Is criticality determined by checklist item, taxonomy code, controller review, or a combination?

3. **Release semantics**
   - Can release be considered operationally complete before external clear confirmation, or must it remain blocked?

4. **Offline evidence handling**
   - Are photos uploaded only on reconnect, and what is the allowed local retention/security posture on shared devices?

5. **Checklist governance**
   - Who owns checklist versioning and regulatory mappings?

6. **Trip-start integration**
   - Which system enforces “no trip can be started against that vehicle”?

7. **Data retention details**
   - Is 7-year retention required for all audit metadata or only evidence/inspection records?

8. **Controller review SLA**
   - What happens operationally if AI classification review is delayed?

---

## 19. Open questions

- Is `NotApplicable` a valid checklist outcome?
- Are pre-trip and post-trip checklists versioned independently?
- Is geolocation required for defect notification if device permissions are denied?
- Are there legal requirements for timestamp source integrity beyond device time?
- Must evidence export be PDF, ZIP, JSON bundle, or all three?
- Are workshop jobs always one-to-one with defects, or can multiple defects roll into one job?
- Is dual approval required for release of previously grounded vehicles?
- What exact taxonomy standard is used for defect classification?

---

## 20. Reviewable proposal summary

**Recommendation:** Proceed with a design baseline centered on:

- Angular/Ionic offline-first client
- FastAPI transactional backend
- Azure SQL + Blob immutable evidence
- outbox-driven integration architecture
- separate grounding adapter
- APIM-governed Foundry workflow with human review
- active-active Azure hosting and strong observability

This design is consistent with the supplied constraints and is implementable, but it should be treated as **proposed pending human approval** because source documents are draft and partially truncated.

If useful, I can next convert this into:
1. a formal **ADR set**,  
2. a **C4-style component breakdown**,  
3. a **SQL schema draft**, or  
4. an **OpenAPI contract starter**.