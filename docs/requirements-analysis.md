# Requirements Agent Proposal — Plan Stage
Project: **Fleet Inspection And Maintenance**  
Environment: **Dev**  
Status: **Reviewable proposal for human approval**

## 1. Scope Summary

Based on the provided requirements, technical constraints, and UX inputs, this release targets:

- Guided **pre-trip and post-trip inspections**
- **Critical defect grounding** with do-not-drive messaging
- **Defect routing** to workshop with evidence
- **Workshop repair and release to service**
- **Usage-based service scheduling** from odometer/engine hours
- **Offline capture and sync**
- **Compliance evidence export**

Out of scope per intake:

- Route planning/dispatch
- Fuel card/tax/toll
- Driver licensing/medical/HOS
- Procurement/leasing/disposal
- New analytics beyond existing fleet availability dashboards

---

## 2. Source Traceability

Primary sources used:

- Requirements doc:
  - Purpose/scope
  - EPIC-01
  - FEAT-01, FEAT-02, partial FEAT-03
  - Success measures
- Technical requirements doc:
  - Angular/Ionic frontend
  - FastAPI backend
  - Azure SQL
  - Blob storage immutable evidence
  - Foundry + Microsoft Agent Framework defect classification via APIM
  - Entra ID, App Service, GitHub Actions
  - Integration SLAs/failure behavior
- UX mockups:
  - SCR-01 Guided Vehicle Inspection
  - SCR-02 Defect and Grounding
  - SCR-03 Workshop Repair and Release
  - SCR-04 Service Plan and Compliance
  - Interaction/accessibility details

Note: Some feature details for FEAT-03/FEAT-04 are partially inferred from the visible intake text and UX/technical documents. These are marked for confirmation.

---

## 3. Proposed Epic Structure

## Epic EPIC-01 — Fleet Inspection And Maintenance
**Outcome:** Drivers complete guided inspections that automatically ground unsafe vehicles and route defects to the workshop, so unsafe vehicles are not driven and roadworthiness can be evidenced at any time.

### Proposed feature breakdown
1. **FEAT-01 Guided Vehicle Inspection**
2. **FEAT-02 Defect Grounding and Notification**
3. **FEAT-03 Workshop Repair and Release**
4. **FEAT-04 Service Plan and Compliance**
5. **FEAT-05 Offline Capture and Synchronization**
6. **FEAT-06 Audit, Evidence Retention, and Compliance Export**
7. **FEAT-07 Defect Classification Review Workflow**

Rationale:
- FEAT-05/06/07 are necessary to make the stated business and technical requirements implementable and traceable.
- They may be implemented partly across other features, but separating them improves planning and governance.

---

## 4. Features, User Stories, and Acceptance Criteria

## FEAT-01 Guided Vehicle Inspection
**Goal:** Present the correct checklist for the selected vehicle, capture odometer first, require evidence for failed items, and store immutable inspection records.

### User Story US-101
**As a driver, I want a guided checklist matched to the vehicle I am about to drive, so that I inspect the right items in the right order.**

**Acceptance Criteria**
1. Given I scan or select a vehicle, when the inspection opens, then the checklist matches the vehicle type and regulatory category.
2. Given the inspection starts, when the first step is shown, then odometer is requested before checklist items.
3. Given telematics odometer is available, when the inspection opens, then the odometer field is pre-filled and its source is shown.
4. Given the entered odometer is lower than the last recorded reading, when I continue, then I must provide an explanation before proceeding.
5. Given an item is marked failed, when I continue, then at least one photograph and a description of at least 15 characters are required.
6. Given I pass an item, when the outcome is recorded, then the next item is shown automatically.
7. Given I am using the app one-handed or with gloves, then pass/fail controls are large, clearly labeled buttons.

### User Story US-102
**As a fleet compliance manager, I want every inspection recorded against driver, vehicle, time and odometer, so that roadworthiness evidence is complete without manual assembly.**

**Acceptance Criteria**
1. Given an inspection is submitted, when it is stored, then driver, vehicle, timestamp, odometer, item outcomes, descriptions, and evidence references are recorded.
2. Given an inspection is submitted, when storage completes, then the record is immutable to end users.
3. Given the device is offline, when the driver submits, then the inspection is queued locally with original capture time preserved.
4. Given connectivity returns, when queued inspections sync, then synchronization begins automatically and completes within 5 minutes under normal service availability.
5. Given a checklist is cached for a vehicle type, when the device is offline, then the driver can still complete the inspection using the cached checklist.
6. Given a vehicle is not assigned to the driver, when selected, then confirmation is required before continuing.

### Tasks
- Define vehicle-type/regulatory-category checklist model
- Implement vehicle scan/select flow
- Implement odometer-first workflow with telematics prefill/fallback
- Implement one-item-at-a-time checklist UI
- Implement fail evidence capture with camera integration
- Implement immutable inspection persistence model
- Implement checklist caching on device
- Implement validation and accessibility behaviors from UX spec
- Add audit metadata to inspection submission

### Dependencies
- Vehicle master data from fleet management system
- Telematics odometer feed
- Entra ID authentication
- Blob storage for evidence
- Azure SQL schema for inspections/items

### Risks
- Checklist versioning may create ambiguity for historical evidence
- Odometer discrepancies may block drivers without a clear override path
- Camera/file upload behavior may vary across handheld devices

---

## FEAT-02 Defect Grounding and Notification
**Goal:** Automatically ground vehicles on critical defects, block trip start, show do-not-drive messaging, and notify workshop/controller/manager.

### User Story US-201
**As a driver, I want to be told clearly and immediately when a defect grounds the vehicle, so that I do not drive something unsafe.**

**Acceptance Criteria**
1. Given a defect classified as critical, when the inspection is submitted, then vehicle status becomes Grounded in the solution record.
2. Given a defect classified as critical, when submission completes, then the driver sees an unambiguous do-not-drive message.
3. Given a vehicle is grounded, when a trip start is attempted through this application, then the trip cannot be started.
4. Given the grounding integration to the fleet management system fails, when submission completes, then the driver is still told not to drive.
5. Given the grounding integration fails, when failure is detected, then the duty manager is alerted within 60 seconds.
6. Given a grounding banner is shown, then it persists until a recorded release to service exists and is recognized by the application.

### User Story US-202
**As a workshop controller, I want critical defects to reach me immediately with the evidence attached, so that repair can start without a phone call.**

**Acceptance Criteria**
1. Given a vehicle is grounded, when notification is dispatched, then workshop controller and duty manager receive defect details, evidence references, and vehicle location within 5 minutes.
2. Given a notification channel fails, when delivery is attempted, then fallback channels are used in configured escalation order.
3. Given delivery attempts occur, when they are logged, then recipient, channel, timestamp, and outcome are recorded.
4. Given all channels fail, when 5 minutes elapse, then the duty manager is paged/escalated and the failure is visible in status.
5. Given the driver views the grounding screen, when notification status updates, then the status is visible in near real time.

### Tasks
- Define critical defect severity rules and grounding trigger
- Implement transactional grounding decision at inspection submission
- Implement grounding adapter integration contract
- Implement do-not-drive UX and persistent banner
- Implement trip-start gate in app
- Implement notification dispatcher integration with fallback
- Implement notification status tracking UI/API
- Implement alerting path for grounding integration failure

### Dependencies
- Defect severity/taxonomy mapping
- Fleet management vehicle status API
- Graph/Teams notification channels
- Vehicle location source
- Workshop controller and duty manager recipient directory

### Risks
- Authoritative grounding across systems may have temporary inconsistency
- Notification recipient resolution may be incomplete by depot/shift
- Trip-start blocking may depend on external process not fully in this solution

---

## FEAT-03 Workshop Repair and Release
**Goal:** Turn defects into workshop jobs, support diagnosis and repair recording, and require authorized release before vehicle use.

### User Story US-301
**As a workshop technician, I want the defect, its evidence and the vehicle history in the job, so that I can diagnose before the vehicle arrives on the ramp.**

**Acceptance Criteria**
1. Given a workshop job is created from a defect, when opened, then the original failed item, description, photographs, odometer, timestamp, and vehicle identity are shown.
2. Given a workshop job is opened, when vehicle history is available, then recent defects, repairs, and service context are shown.
3. Given a grounded defect exists, when the job is created, then the job is linked back to the originating inspection and defect record.
4. Given evidence exists, when viewed in the job, then it is read-only.

### User Story US-302
**As a workshop technician, I want to record repair actions and parts used, so that the maintenance record is complete.**

**Acceptance Criteria**
1. Given I work a job, when I save repair details, then labor notes, repair outcome, and parts used are recorded.
2. Given required repair details are missing, when I attempt to complete the job, then completion is blocked with clear validation.
3. Given the job is completed, when saved, then completion timestamp and technician identity are recorded.

### User Story US-303
**As a workshop controller or competent person, I want a vehicle released back to service only after repair evidence is complete, so that unsafe vehicles are not returned prematurely.**

**Acceptance Criteria**
1. Given a grounded vehicle has an open defect job, when release is attempted, then release is blocked until required repair details are complete.
2. Given release authority is required, when a user attempts release, then only authorized roles may perform it.
3. Given a release is recorded, when completed, then releaser identity, timestamp, and any post-repair check evidence are stored.
4. Given release is recorded, when the application updates status, then the vehicle is eligible to return to service.
5. Given release integration to fleet management fails, when release is recorded locally, then the discrepancy is flagged for operational follow-up and all attempts are logged.

### Tasks
- Define workshop job domain model
- Implement defect-to-job creation flow
- Implement job detail screen with evidence/history
- Implement repair notes and parts capture
- Implement release authorization rules
- Implement post-repair evidence capture
- Implement release status propagation and discrepancy handling
- Implement audit trail for repair/release actions

### Dependencies
- Workshop role model and authorization
- Vehicle/defect history data availability
- Fleet management status clear/release API behavior
- Blob storage for post-repair evidence

### Risks
- “Competent person” authorization criteria need explicit business definition
- Parts capture may require integration with an inventory system not described
- Release semantics between local system and fleet management system may differ

---

## FEAT-04 Service Plan and Compliance
**Goal:** Schedule service based on usage and provide compliance visibility/export.

### User Story US-401
**As a fleet planner, I want service due dates projected from odometer and engine-hour usage, so that vehicles are serviced within the due window.**

**Acceptance Criteria**
1. Given odometer and engine-hour readings are available, when the service plan calculator runs, then next service due windows are projected from usage rules.
2. Given telematics data is delayed or unavailable, when calculation runs, then the latest valid manual reading may be used and flagged as manual.
3. Given a vehicle approaches its due window, when threshold criteria are met, then due notifications are raised.
4. Given service completion is recorded, when recalculation runs, then the next due window is updated.

### User Story US-402
**As a compliance manager, I want to export inspection and service evidence for an audited period, so that roadworthiness can be evidenced on demand.**

**Acceptance Criteria**
1. Given an audited period and vehicle scope are selected, when export is requested, then inspections, defects, repairs, releases, and service compliance records are included.
2. Given exported evidence is generated, when delivered, then records are complete, time-bounded, and traceable to source IDs.
3. Given immutable evidence is referenced, when exported, then evidence links or packaged files correspond to stored unaltered records.
4. Given export generation fails, when the failure occurs, then the requester sees a clear error and the failure is logged.

### Tasks
- Define service rule model for usage-based scheduling
- Implement service plan calculator job
- Implement due-window notification logic
- Implement planner/compliance view for service status
- Implement compliance export generation
- Define export format and evidence packaging
- Add manual-reading reconciliation logic

### Dependencies
- Fleet management service plan source data
- Telematics odometer/engine-hour feed
- Notification dispatcher
- Audit/export storage strategy

### Risks
- Service rule ownership between systems of record may be unclear
- Engine-hour availability may vary by vehicle class
- Export size/performance may be significant for long audit periods

---

## FEAT-05 Offline Capture and Synchronization
**Goal:** Ensure inspections are never lost in low/no connectivity conditions.

### User Story US-501
**As a driver, I want to complete and submit an inspection without connectivity, so that a dead spot in the yard does not stop me working.**

**Acceptance Criteria**
1. Given the device is offline, when I complete an inspection, then it is stored locally with all required data and evidence references.
2. Given the device is offline, when I submit, then I see that the inspection is queued offline.
3. Given connectivity returns, when sync resumes, then queued inspections are submitted automatically in capture order unless superseded by defined conflict rules.
4. Given sync fails for an item, when failure occurs, then the item remains queued and the user is not told it succeeded.
5. Given a critical defect was captured offline, when local submission completes, then the driver still sees do-not-drive guidance immediately.

### Tasks
- Define offline local data model and queue semantics
- Implement service worker/local persistence
- Implement evidence upload retry behavior
- Implement sync status UI
- Implement conflict/idempotency handling
- Define offline critical-defect local behavior

### Dependencies
- Mobile platform storage capabilities
- API idempotency support
- Cached checklist availability

### Risks
- Offline grounding cannot make external system state authoritative until reconnection
- Large photo payloads may delay sync
- Device storage limits may affect evidence retention before sync

---

## FEAT-06 Audit, Evidence Retention, and Compliance Export
**Goal:** Preserve immutable evidence for 7 years and support auditability.

### User Story US-601
**As a compliance manager, I want inspection and repair evidence to be immutable and retained, so that records remain defensible for audits and incidents.**

**Acceptance Criteria**
1. Given an inspection is submitted, when evidence is stored, then associated photographs are written to immutable storage.
2. Given a submitted inspection exists, when a user attempts to edit evidence or item outcomes, then the system prevents modification.
3. Given retention rules apply, when records age, then they remain retained for the required 7-year period.
4. Given an audit trail is reviewed, when actions are displayed, then submission, sync, notification, repair, and release events are traceable by timestamp and actor.

### Tasks
- Configure immutable evidence storage approach
- Define retention and lifecycle policy requirements
- Implement audit event model
- Implement evidence/reference retrieval for export
- Validate immutability constraints in app/API

### Dependencies
- Azure Blob storage capabilities/configuration
- Security/compliance policy confirmation
- Export feature design

### Risks
- Legal retention requirements may need formal compliance sign-off
- Immutable storage operational model may affect deletion/correction processes

---

## FEAT-07 Defect Classification Review Workflow
**Goal:** Classify free-text defects into standard taxonomy using agent workflow, with human review before code application.

### User Story US-701
**As a workshop controller, I want free-text defect descriptions mapped to the standard taxonomy for review, so that severity and downstream handling are consistent.**

**Acceptance Criteria**
1. Given a defect description is submitted, when classification is requested, then the workflow sends the request through APIM to the Foundry-based classification workflow.
2. Given a classification suggestion is returned, when presented to the controller, then the suggested taxonomy code and confidence/context are visible for review.
3. Given the controller approves or changes the suggestion, when confirmed, then the selected taxonomy code is applied to the defect.
4. Given no review has occurred, when downstream code application is evaluated, then the taxonomy code is not treated as final.
5. Given the workflow or model call fails, when failure occurs, then the defect remains available for manual classification and the failure is logged.

### Tasks
- Define defect taxonomy and severity mapping
- Define review-state workflow
- Implement APIM-routed classification integration
- Implement controller review UI
- Implement manual override and audit logging
- Implement timeout/failure fallback behavior

### Dependencies
- Standard defect taxonomy
- Foundry project and agent workflow availability
- APIM route and managed identity
- Workshop controller review process

### Risks
- Misclassification could incorrectly influence grounding severity if review controls are bypassed
- Taxonomy governance may not yet be mature
- Model latency may affect controller workflow

---

## 5. Cross-Feature Non-Functional Requirements

Derived from intake and UX/technical constraints.

| ID | Non-functional requirement | Proposal |
|---|---|---|
| NFR-001 | Authoritative grounding | Grounding decision must be transactionally recorded with the triggering inspection in solution-owned records; external fleet status updates must be idempotent and retried until resolved. |
| NFR-002 | Driver safety messaging | Critical grounding message must be unambiguous, persistent, and not dismissible by the driver until release is recorded. |
| NFR-003 | Offline operation | Driver inspection flow must support offline capture and queued sync. |
| NFR-004 | Notification resilience | Notification delivery must use fallback channels and log every attempt. |
| NFR-005 | Immutable evidence | Submitted inspections and evidence must be immutable to end users. |
| NFR-006 | Sync timeliness | Queued inspections should sync within 5 minutes of reconnection under normal service conditions. |
| NFR-007 | Accessibility/usability | Driver flow must support one-handed use, gloves, dark/wet conditions, clear labels, and screen-reader announcements for critical states. |
| NFR-008 | Security | Entra ID authentication, attributable per-driver sign-in, conditional access requiring compliant devices. |
| NFR-009 | Retention | Roadworthiness evidence retained for 7 years. |
| NFR-010 | Availability | App Service active-active across two regions behind Front Door; no planned failover gap. |
| NFR-011 | AI governance | All model traffic routed through APIM with managed identity, quotas, content safety, and correlation headers. |
| NFR-012 | Auditability | Submission, sync, notification, repair, release, and classification review actions must be fully auditable. |

---

## 6. Proposed Work Breakdown Structure

## Stream A — Product and Domain
- Confirm checklist ownership/versioning
- Confirm defect taxonomy and criticality rules
- Confirm release authority roles
- Confirm service due-window rules
- Confirm audit/export format and scope

## Stream B — Frontend
- Driver inspection flow
- Grounding/notification screens
- Workshop repair/release screens
- Planner/compliance screens
- Offline queue and sync status
- Accessibility implementation

## Stream C — Backend/API
- Inspection API and persistence
- Grounding rule engine
- Workshop job/release APIs
- Service plan calculator
- Export APIs
- Audit/event logging

## Stream D — Integrations
- Fleet management vehicle status
- Vehicle/service-plan master data
- Telematics odometer/engine hours
- Graph/Teams notifications
- APIM/Foundry classification workflow
- Blob storage evidence handling

## Stream E — Platform/Quality
- Entra ID and role model
- Blob immutability and retention
- CI/CD with environment protections
- Observability/correlation
- Performance, resilience, and failover testing

---

## 7. Dependency Map

### External/system dependencies
- Fleet management system:
  - vehicle master
  - service plans
  - vehicle status grounding/release
- Telematics:
  - odometer
  - engine hours
- Microsoft Graph / Teams:
  - notifications
- Foundry + Microsoft Agent Framework via APIM:
  - defect classification
- Entra ID:
  - authentication and role attribution
- Azure Blob:
  - immutable evidence storage

### Internal sequencing dependencies
1. Domain rules and taxonomy confirmed
2. Data model and API contracts defined
3. Offline model and idempotency defined
4. Driver inspection flow built
5. Grounding and notification built
6. Workshop job/release built
7. Service plan/compliance export built
8. Classification review workflow integrated
9. End-to-end audit/compliance validation

---

## 8. Key Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---:|---|
| Grounding state differs temporarily between local solution and fleet management system | High | Medium | Treat solution record as immediate operational truth for driver UX; implement idempotent retries and discrepancy alerts. |
| Criticality depends on taxonomy classification review timing | High | Medium | Define whether grounding uses direct checklist criticality, reviewed taxonomy, or both; require explicit business rule approval. |
| Offline critical defects cannot instantly update external systems | High | High | Show immediate local do-not-drive state; sync authoritative external grounding on reconnection; define operational fallback. |
| Incomplete FEAT-03/04 details in intake excerpt | Medium | Medium | Mark as needing business confirmation before build commitment. |
| Service-plan ownership split across systems | Medium | Medium | Confirm source-of-record boundaries and update responsibilities. |
| Evidence immutability/retention setup may affect operational support | Medium | Low | Review with security/compliance before implementation. |
| Shared in-cab devices may weaken attribution if sign-in discipline is poor | High | Medium | Enforce per-driver sign-in and session controls. |
| Notification escalation paths may vary by depot/shift | Medium | Medium | Define recipient resolution rules early. |

---

## 9. Open Questions Requiring Human Review

1. **Grounding rule source:**  
   Is grounding determined directly from checklist item criticality, from reviewed taxonomy code, or from both?

2. **Trip start enforcement boundary:**  
   Does this solution own trip-start blocking, or only display do-not-drive guidance while another system enforces dispatch/trip controls?

3. **Workshop job creation timing:**  
   Is job creation automatic on critical defects only, or on all defects with severity-based routing?

4. **Release authority:**  
   Which roles qualify as “competent person” for release to service?

5. **Vehicle history scope in workshop job:**  
   What history window is required: last 30/60/90 days, open defects only, or full history?

6. **Service plan ownership:**  
   Does this solution calculate due windows only, or can it also update service-plan state in the fleet management system?

7. **Compliance export format:**  
   PDF pack, CSV + evidence bundle, or both?

8. **Offline critical defect operating policy:**  
   If a driver is offline and records a critical defect, what operational escalation is required before sync?

9. **Post-trip inspection scope:**  
   Are pre-trip and post-trip checklists distinct by vehicle type and shift context?

10. **Evidence rules:**  
    Is one photo always sufficient for a failed item, or do some defect categories require multiple photos/video?

---

## 10. Recommended MVP Cut

### MVP Must Have
- Guided inspection with odometer-first flow
- Fail evidence capture
- Immutable inspection record
- Offline queue and sync
- Critical defect grounding in solution record
- Do-not-drive messaging
- Notification to workshop/controller/manager
- Workshop job creation
- Repair recording
- Authorized release to service
- Compliance export baseline
- Audit logging

### Phase 2 Candidate
- AI-assisted defect classification review workflow
- Advanced service due-window notifications
- Rich planner dashboards
- Expanded evidence packaging options
- Enhanced vehicle history views

Reason: AI classification and richer service/compliance capabilities are valuable but not required to achieve the core safety outcome.

---

## 11. Traceability Matrix

| Source Requirement | Proposed Artifact |
|---|---|
| EPIC-01 | Epic EPIC-01 |
| US-101 | FEAT-01 / US-101 |
| US-102 | FEAT-01 / US-102 |
| US-201 | FEAT-02 / US-201 |
| US-202 | FEAT-02 / US-202 |
| FEAT-03 workshop repair/release intent | FEAT-03 / US-301, US-302, US-303 |
| Usage-based service scheduling | FEAT-04 / US-401 |
| Compliance evidence export | FEAT-04 / US-402, FEAT-06 / US-601 |
| Offline capture and sync | FEAT-05 / US-501 |
| Foundry classification with controller review | FEAT-07 / US-701 |
| UX SCR-01 | FEAT-01, FEAT-05, NFR-007 |
| UX SCR-02 | FEAT-02, NFR-002, NFR-004 |
| UX SCR-03 | FEAT-03 |
| UX SCR-04 | FEAT-04, FEAT-06 |
| Technical immutability/retention | FEAT-06, NFR-005, NFR-009 |
| APIM-routed model traffic | FEAT-07, NFR-011 |

---

## 12. Review Recommendation

**Recommendation:** Approve with clarifications.

This proposal is structurally ready for review, but build planning should not be finalized until the open questions are resolved, especially:

- grounding rule source,
- trip-start enforcement boundary,
- release authority,
- service-plan ownership,
- offline critical defect operating policy.

If helpful, I can next convert this proposal into either:

1. a **backlog-ready hierarchy** (epics/features/stories/tasks in import-friendly format), or  
2. a **formal traceability specification** with IDs, dependencies, and test coverage placeholders.