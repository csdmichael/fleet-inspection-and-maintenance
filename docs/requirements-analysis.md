# Requirements Agent — Plan-Stage Reviewable Proposal

**Project:** Fleet Inspection and Maintenance  
**Target environment:** Dev  
**Proposal status:** For review and approval; no implementation or external-system changes performed  
**As-of date:** 27 August 2026

## 1. Review basis and qualification

The proposal is based on the supplied intake content:

- `Fleet Inspection And Maintenance - Requirements.docx`
- `Fleet Inspection And Maintenance - Technical Requirements.docx`
- `Fleet Inspection And Maintenance - UX Mockups.docx`

All supplied documents are marked **Draft**, and `approvedArtifacts` is empty. Therefore, this is a **candidate delivery plan**, not an approved baseline.

The requirements document text supplied to this agent is truncated after US-301, and the technical requirements text is truncated during the Foundry integration section. Items marked **Proposed** require confirmation against the complete documents before implementation.

---

# 2. Proposed product outcome

Deliver a digital fleet inspection and maintenance workflow that:

1. Guides a driver through the checklist applicable to the selected vehicle.
2. Captures immutable inspection evidence, including odometer and photographs.
3. Grounds a vehicle automatically when a critical defect is identified.
4. Prevents trip start while the vehicle is grounded.
5. Routes defects and evidence to the workshop.
6. Records repairs and requires competent release before return to service.
7. Calculates usage-based servicing from odometer and engine-hour readings.
8. Supports offline roadside or yard capture and later synchronization.
9. Produces roadworthiness and service-compliance evidence on demand.

## Success measures

| Outcome | Target | Proposed measurement |
|---|---:|---|
| Critical defects grounded before next use | 100% | Grounding events compared with trip-start records |
| Median defect report to workshop job creation | 2 hours or less | Inspection/defect and job timestamps |
| Complete inspection evidence for audited period | 99% | Compliance evidence export |
| Services completed within usage-based due window | 92% | Service-plan compliance report |

---

# 3. Proposed scope baseline

## In scope

- Guided daily pre-trip and post-trip inspections
- Vehicle-specific checklists
- Odometer and engine-hour capture
- Defect descriptions and photographs
- Critical-defect grounding
- Driver do-not-drive notification
- Trip-start blocking for grounded vehicles
- Workshop notification and job creation
- Repair and parts recording
- Competent-person release to service
- Usage-based service scheduling
- Compliance evidence export
- Offline capture and synchronization
- Defect taxonomy classification through Microsoft Foundry and Microsoft Agent Framework, with workshop-controller confirmation
- Auditability, immutable evidence, and retention

## Out of scope

- Route planning
- Dispatch
- Telematics-based driver-behaviour scoring
- Fuel cards, fuel tax, and toll reconciliation
- Driver licensing, medical certification, and hours-of-service compliance
- Vehicle procurement, leasing, disposal, and residual value management
- New analytics beyond existing fleet availability dashboards

---

# 4. Epic and feature decomposition

## EPIC-01 — Fleet Inspection and Maintenance

**Outcome statement:**  
As a fleet operations team, we need drivers to complete guided inspections that ground unsafe vehicles automatically and route defects directly to the workshop, so that no vehicle is driven with a critical defect and roadworthiness can be evidenced at any time.

**Business owner:** Head of Fleet Operations

| Feature | Title | Primary users | UX mapping |
|---|---|---|---|
| FEAT-01 | Guided Vehicle Inspection | Driver, compliance manager | SCR-01 |
| FEAT-02 | Defect Grounding and Notification | Driver, workshop controller, duty manager | SCR-02 |
| FEAT-03 | Workshop Repair and Release | Workshop technician, controller, competent releaser | SCR-03 |
| FEAT-04 | Usage-Based Service Planning and Compliance | Fleet planner, compliance manager | SCR-04 |
| FEAT-05 | Offline Capture and Synchronization | Driver, fleet operations | SCR-01/SCR-02 |
| FEAT-06 | Evidence, Audit, and Reporting | Compliance manager, planner, auditor | SCR-01–SCR-04 |

FEAT-05 and FEAT-06 are proposed decomposition items to make explicit capabilities referenced across the supplied requirements.

---

# 5. User stories and acceptance criteria

## FEAT-01 — Guided Vehicle Inspection

### US-101 — Vehicle-specific guided checklist

**Source:** Requirements document, US-101; UX SCR-01

As a driver, I want a guided checklist matched to the vehicle I am about to drive, so that I inspect the right items in the right order.

**Acceptance criteria**

1. Given a driver scans or selects a vehicle, when the inspection opens, then the checklist matches the vehicle type and regulatory category.
2. The odometer is requested before the checklist begins.
3. Each inspection item is presented one at a time.
4. Every required item must have a pass or fail outcome.
5. A failed item requires a photograph and a description of at least 15 characters before the driver can continue.
6. A vehicle not assigned to the driver requires an explicit confirmation before inspection.
7. Manual vehicle registration is available when scanning is unavailable.
8. The progress indicator shows completed and remaining required items.
9. The checklist can be cached for the applicable vehicle type for offline use.

### US-102 — Immutable inspection record

**Source:** Requirements document, US-102; UX SCR-01

As a fleet compliance manager, I want every inspection recorded against driver, vehicle, time, and odometer, so that roadworthiness evidence is complete without manual assembly.

**Acceptance criteria**

1. A submitted inspection records driver identity, vehicle identity, timestamp, odometer, checklist version, every item outcome, descriptions, and evidence references.
2. The submitted inspection cannot be edited or deleted by the driver or ordinary operational users.
3. The system records whether the odometer came from telematics or was entered manually.
4. An offline submission preserves the original capture time.
5. An offline submission is queued locally and synchronizes within five minutes after connectivity returns, subject to service availability.
6. Duplicate synchronization does not create duplicate inspections or grounding events.
7. Synchronization failures are visible to the user and operational monitoring.

### US-103 — Odometer validation

**Source:** UX SCR-01; technical requirements

As a driver, I want the odometer value validated before I start the inspection, so that usage and compliance records remain reliable.

**Acceptance criteria**

1. The odometer is prefilled from telematics when available.
2. A submitted value must be at least the last recorded value.
3. A lower value requires an explanation and is flagged for review.
4. The source and validation result are retained in the inspection evidence.
5. The service remains usable with a driver-entered value when telematics is unavailable.

---

## FEAT-02 — Defect Grounding and Notification

### US-201 — Automatic grounding and do-not-drive message

**Source:** Requirements document, US-201; UX SCR-02

As a driver, I want to be told clearly and immediately when a defect grounds the vehicle, so that I do not drive something unsafe.

**Acceptance criteria**

1. Given a defect classified as critical, when the inspection is submitted, then the vehicle becomes `Grounded`.
2. The driver receives an unambiguous, persistent “Do not drive” message.
3. The grounding banner cannot be dismissed by the driver.
4. No trip can be started against a grounded vehicle.
5. The grounding reason and affected defect are shown in text, not colour alone.
6. A grounding event uses an idempotency key to prevent duplicate state changes.
7. If the fleet-management integration fails, the driver is still told not to drive.
8. If grounding cannot be applied, the duty manager is alerted within 60 seconds.
9. A failed grounding operation is retried and remains manually resolvable.

### US-202 — Immediate workshop notification

**Source:** Requirements document, US-202; UX SCR-02

As a workshop controller, I want critical defects to reach me immediately with evidence attached, so that repair can start without a phone call.

**Acceptance criteria**

1. A grounded vehicle creates or initiates a workshop job.
2. The workshop controller and duty manager receive the defect, evidence, vehicle identity, and vehicle location within five minutes.
3. Notification attempts record recipient, channel, timestamp, outcome, and correlation identifier.
4. If a notification channel fails, the configured fallback channel is used.
5. If all channels fail within five minutes, the duty manager is paged or otherwise escalated.
6. The driver can see notification status and retry state.
7. Notification delivery is idempotent.

### US-203 — Defect classification review

**Source:** Technical requirements; UX SCR-02; proposed story

As a workshop controller, I want free-text defects mapped to the standard taxonomy for my review, so that severity and routing are consistent without delegating the safety decision to a model.

**Acceptance criteria**

1. The defect-classification workflow receives the description through the inspection service.
2. All model traffic is routed through Azure API Management.
3. The workflow returns a proposed taxonomy code and confidence or review metadata.
4. A workshop controller must confirm or amend the proposed taxonomy before it becomes authoritative.
5. The model cannot independently ground or release a vehicle.
6. A failed, unavailable, or timed-out model call leaves the defect available for manual classification.
7. The model request and response metadata are correlated to the defect without exposing unnecessary personal data.
8. The final human-confirmed taxonomy code and reviewer identity are audited.

---

## FEAT-03 — Workshop Repair and Release

### US-301 — Workshop job with defect evidence

**Source:** Requirements document, US-301; supplied text is truncated

As a workshop technician, I want the defect, its evidence, and the vehicle history in the job, so that I can diagnose before the vehicle arrives on the ramp.

**Acceptance criteria**

1. A workshop job created from a defect includes the original failed item, description, photographs, odometer, vehicle, driver, and inspection reference.
2. The job displays relevant prior inspection and maintenance history according to the user’s permissions.
3. The job has a unique identifier and links back to the originating defect.
4. The job status and timestamps are retained.
5. Evidence remains read-only and immutable.

### US-302 — Record repair and parts used

**Source:** Requirements scope and feature statement; proposed story

As a workshop technician, I want to record diagnosis, work performed, parts, and completion evidence, so that the repair history is complete.

**Acceptance criteria**

1. A technician can record diagnosis, corrective action, labour notes, parts, quantities, and completion timestamp.
2. Parts and repair details are associated with the workshop job and vehicle.
3. Post-repair photographs or other required evidence can be attached.
4. A job cannot be marked ready for release without required repair fields.
5. Changes to repair data are audited with user and timestamp.

### US-303 — Competent-person release to service

**Source:** Requirements scope and feature statement; UX SCR-03; proposed story

As an authorized competent person, I want to release a repaired vehicle back to service, so that a grounded vehicle cannot be driven until safety checks are complete.

**Acceptance criteria**

1. Only an authorized competent person can release a grounded vehicle.
2. Release requires confirmation of repair completion and any required post-repair checks.
3. Release records the releaser, timestamp, odometer, notes, and evidence.
4. The vehicle remains grounded until the release is successfully recorded.
5. The grounding status is cleared in the fleet-management system using a controlled, idempotent operation.
6. A failed status-clear operation leaves the vehicle blocked and alerts the appropriate operational role.
7. The driver sees the updated safe-to-drive state only after release is authoritative.
8. A release cannot be backdated without an explicit audited correction process.

---

## FEAT-04 — Usage-Based Service Planning and Compliance

### US-401 — Usage-based service plan

**Source:** Requirements scope, technical requirements, UX SCR-04; proposed story

As a fleet planner, I want the next service projected from usage, so that maintenance is scheduled from actual vehicle use rather than calendar dates.

**Acceptance criteria**

1. The service plan consumes odometer and engine-hour readings from the fleet-management or telematics sources.
2. The next due point is calculated from the configured usage interval for the vehicle/service type.
3. The system supports a defined due window around the usage threshold.
4. Manual readings are accepted when the source feed is unavailable and are flagged accordingly.
5. Reconciled readings do not silently overwrite prior evidence.
6. The plan identifies due, approaching-due, overdue, and data-quality exception states.
7. Usage calculations are reproducible from retained readings and configuration versions.

### US-402 — Service due notifications

As a fleet planner, I want notifications when vehicles approach or exceed their usage-based service window, so that service can be scheduled in time.

**Acceptance criteria**

1. Notifications are generated according to an approved threshold and escalation policy.
2. Notifications identify vehicle, service type, current usage, due threshold, and data source.
3. Duplicate notifications are suppressed or explicitly marked as repeats.
4. Notification attempts and outcomes are audited.
5. Failures are visible to fleet operations.

### US-403 — Compliance evidence export

**Source:** Success measures; UX SCR-04; proposed story

As a compliance manager, I want to export inspection and service evidence for an audit period, so that roadworthiness can be demonstrated on demand.

**Acceptance criteria**

1. A user with the required permission can select vehicle(s) and an audit period.
2. The export includes inspections, outcomes, defects, photographs or evidence references, grounding events, repair jobs, releases, service readings, and relevant timestamps.
3. The export identifies missing or exceptional records rather than silently omitting them.
4. Export contents are traceable to immutable source records.
5. The export is access-controlled and its generation is audited.
6. The output format and retention behavior are approved before implementation.

---

## FEAT-05 — Offline Capture and Synchronization

### US-501 — Offline inspection capture

As a driver, I want to complete an inspection without connectivity, so that a dead spot does not cause an inspection to be lost.

**Acceptance criteria**

1. A previously available checklist can be used offline.
2. Inspection outcomes, descriptions, photographs, timestamps, and odometer are stored locally in an encrypted application store.
3. The user is clearly shown when the inspection is queued offline.
4. The client prevents accidental submission of an incomplete inspection.
5. Evidence is associated with the correct inspection before synchronization.
6. The client does not claim a server-authoritative grounding state while disconnected; it displays the required safety warning and local pending state.

### US-502 — Reliable synchronization

As fleet operations, I want queued inspections synchronized safely when connectivity returns, so that offline records become authoritative without duplication or data loss.

**Acceptance criteria**

1. Queued records synchronize automatically when connectivity returns.
2. Synchronization is retryable and idempotent.
3. The server validates identity, checklist version, vehicle, odometer, and evidence integrity.
4. Conflicts are surfaced for operational review rather than silently discarded.
5. A synchronization receipt records server acceptance, rejection, or pending resolution.
6. Critical defects detected during synchronization invoke the same grounding and escalation safeguards as online submissions.

---

## FEAT-06 — Evidence, Audit, Security, and Reporting

### US-601 — Immutable evidence retention

As a compliance manager, I want submitted evidence retained without alteration, so that it can support roadworthiness audits.

**Acceptance criteria**

1. Submitted inspection evidence and post-repair evidence are stored in immutable or append-only form.
2. Evidence is retained for seven years, subject to approved legal and policy requirements.
3. Access to evidence is authorized by role and recorded.
4. Evidence references remain stable after synchronization.
5. Tampering, deletion, or retention-policy failures generate alerts.

### US-602 — Role-based access and attribution

As a system owner, I want users and actions attributable to named identities, so that safety decisions and evidence access are accountable.

**Acceptance criteria**

1. Microsoft Entra ID is used for authentication.
2. Conditional Access requires an Intune-compliant device where applicable.
3. Shared in-cab devices require per-driver sign-in.
4. Driver, workshop, planner, compliance, duty-manager, and competent-releaser permissions are separated.
5. Every safety-relevant action records actor, timestamp, target record, and outcome.
6. Unauthorized attempts are denied and logged.

### US-603 — Operational and compliance reporting

As fleet operations, I want operational views of grounded vehicles, open defects, workshop jobs, service due states, and synchronization failures, so that exceptions can be managed.

**Acceptance criteria**

1. Users see only data permitted by their role and fleet scope.
2. Grounded vehicles and unresolved critical defects are prominently identifiable.
3. Integration, notification, and synchronization failures are visible.
4. Existing fleet availability dashboards remain the reporting boundary unless additional analytics are approved.
5. Report values reconcile to the underlying source records.

---

# 6. Non-functional requirements and quality targets

The supplied UX references `NFR-002` through `NFR-007`, but the definitions were not included in the provided text. The following are proposed interpretations based on the technical and business requirements and require confirmation.

| ID | Proposed requirement |
|---|---|
| NFR-001 | Grounding must be transactional, durable, idempotent, monitored, and never silently lost. |
| NFR-002 | Critical-defect notifications reach the workshop controller and duty manager within five minutes; duty-manager escalation occurs within five minutes if channels fail. |
| NFR-003 | Offline submissions synchronize within five minutes of reconnection, subject to availability and with original capture time retained. |
| NFR-004 | Fleet-management status API calls use a three-second timeout, managed identity, retry, idempotency, and manual-resolution path. |
| NFR-005 | Foundry model calls use a ten-second timeout, are routed through APIM, and require human review before taxonomy application. |
| NFR-006 | Evidence is immutable after submission and retained for seven years. |
| NFR-007 | Application and API must support accessible, outdoor, one-handed operation, including text-based severity and assertive grounding announcements. |
| NFR-008 | Target architecture uses Angular 18/Ionic 8, Python 3.12/FastAPI, Azure SQL, Blob Storage, App Service Premium v3 across two regions, Front Door, Functions, Entra ID, APIM, Foundry, Graph, and managed identities. |
| NFR-009 | All integration and model traffic must include correlation identifiers and produce operational logs without logging secrets or unnecessary sensitive content. |
| NFR-010 | CI/CD uses GitHub Actions with build provenance and environment protection. |

## Quality gates proposed for Dev

- Automated unit and API tests for grounding, release, idempotency, and odometer rules.
- Contract tests for fleet-management, telematics, Graph/Teams, and APIM interfaces.
- Offline/online synchronization tests, including duplicate and conflict scenarios.
- Accessibility testing for the four specified screens.
- Security testing for role boundaries, device requirements, evidence access, and API authorization.
- Resilience tests for integration outage, notification failure, model timeout, and regional failover.
- Evidence immutability and seven-year retention-policy verification.
- Human-review test proving that the model cannot independently apply a safety-critical taxonomy outcome.
- Performance tests against the five-minute notification and five-minute synchronization targets.

---

# 7. Proposed implementation tasks

## Cross-cutting foundation

- Confirm complete requirements, technical requirements, and UX documents.
- Establish domain vocabulary and state model:
  - Inspection
  - Defect
  - Grounded
  - Workshop job
  - Released
  - Service plan
- Define roles, permissions, and competent-person authorization.
- Define checklist versioning and vehicle/regulatory-category mapping.
- Define audit event schema and correlation-ID convention.
- Define data classification, retention, and evidence immutability policy.
- Confirm integration contracts and test environments.
- Establish Dev deployment pipeline, secrets management, monitoring, and alerting.

## FEAT-01 tasks

- Build vehicle scan and manual selection flow.
- Implement vehicle-type checklist retrieval and local caching.
- Implement one-item-at-a-time checklist UI.
- Implement odometer prefill, validation, and manual override reason.
- Implement defect description and camera evidence capture.
- Implement inspection submission API and immutable persistence.
- Add checklist version and source metadata.
- Test accessibility in dark, wet, gloved-use scenarios.

## FEAT-02 tasks

- Define criticality and taxonomy rules.
- Implement grounding transaction and idempotency handling.
- Implement trip-start safety check.
- Implement persistent driver grounding state.
- Implement Foundry classification workflow through APIM.
- Implement controller review and confirmation.
- Implement Graph/Teams notification dispatch and fallback escalation.
- Add integration failure alerting and manual resolution.

## FEAT-03 tasks

- Implement defect-to-workshop-job creation.
- Build technician job view and evidence display.
- Implement repair, parts, and post-repair evidence capture.
- Define competent-person authorization and release workflow.
- Implement release-to-service integration and failure handling.
- Test that grounded vehicles cannot be released or driven through unauthorized paths.

## FEAT-04 tasks

- Confirm service interval and due-window configuration model.
- Integrate odometer and engine-hour readings.
- Implement manual reading fallback and reconciliation.
- Build service-plan calculation function.
- Implement due-state notifications.
- Build compliance evidence export and exception reporting.
- Validate results against representative historical data.

## FEAT-05 tasks

- Select and secure local offline storage.
- Implement queued submission state machine.
- Implement encrypted evidence queue.
- Implement retry, deduplication, and conflict handling.
- Test interrupted uploads, duplicate submissions, clock differences, and storage exhaustion.
- Implement synchronization monitoring and operational replay controls.

## FEAT-06 tasks

- Configure Blob Storage immutability and retention.
- Implement audit logging and restricted evidence access.
- Implement Entra ID, Conditional Access, and role-based authorization.
- Implement operational views for grounding, defects, jobs, service status, and failures.
- Configure telemetry, alerting, dashboards, and trace correlation.
- Perform security, accessibility, compliance, and resilience validation.

---

# 8. Dependencies

| Dependency | Required for | Owner to confirm |
|---|---|---|
| Fleet-management vehicle and trip-start APIs | Grounding, trip blocking, release | Integration Platform / Fleet Systems |
| Telematics odometer and engine-hour feed | Odometer prefill and service planning | Telematics owner |
| Vehicle type and regulatory-category master data | Correct checklist selection | Fleet Systems |
| Checklist and critical-defect taxonomy governance | Inspection and grounding behavior | Fleet Compliance |
| Microsoft Entra ID, Intune compliance, and role groups | Authentication and authorization | Identity team |
| Graph mail/Teams and paging capability | Notifications and escalation | Collaboration/Operations |
| Azure SQL, Blob Storage, App Service, Front Door, Functions | Runtime and evidence persistence | Platform team |
| Azure API Management and Foundry deployment | Defect classification | AI Engineering / Platform |
| Competent-person authorization policy | Release to service | Fleet Operations |
| Retention and legal hold policy | Seven-year evidence retention | Compliance/Legal |
| Existing trip-start enforcement path | Preventing grounded vehicle use | Fleet Systems |
| Complete source requirements and NFR definitions | Baseline approval | Product owner / document owner |

---

# 9. Risks and mitigations

| ID | Risk | Impact | Mitigation |
|---|---|---|---|
| R-01 | Fleet-management grounding or trip-start integration is unavailable or non-authoritative | Unsafe vehicle use or inconsistent status | Define authoritative state contract, fail closed for trip start, retry, alert, and provide manual resolution |
| R-02 | Offline device is lost or compromised | Evidence exposure or loss | Encrypt local storage, minimize retention after confirmed sync, require device compliance, support remote wipe |
| R-03 | Model misclassifies a defect | Incorrect severity or workflow | Human controller confirmation; model cannot ground or release; retain fallback manual classification |
| R-04 | Notification channels fail | Workshop response delay | Multi-channel fallback, escalation timer, monitoring, and visible notification status |
| R-05 | Duplicate or out-of-order offline synchronization | Duplicate inspections or grounding events | Client/server idempotency keys, immutable event IDs, reconciliation queue |
| R-06 | Odometer or engine-hour feed is stale or incorrect | Incorrect service scheduling | Source-quality flags, manual fallback, reconciliation, exception reporting |
| R-07 | Ambiguous definition of “critical defect” | Inconsistent grounding behavior | Approve taxonomy and rule ownership before build; version rules |
| R-08 | Incomplete requirements and truncated source material | Scope gaps and rework | Obtain complete documents and resolve open questions at approval gate |
| R-09 | Seven-year immutability conflicts with operational correction needs | Audit or usability issues | Use append-only corrections with reason, actor, timestamp, and original-value preservation |
| R-10 | Shared devices undermine attribution | Weak accountability | Per-driver sign-in, session timeout, device compliance, and audit validation |
| R-11 | Regional failover creates inconsistent grounding state | Safety and data integrity risk | Define transaction/outbox strategy, reconciliation, and failover drills |
| R-12 | UX is difficult in rain, darkness, or with gloves | Low adoption or missed checks | Conduct device and field usability testing before release approval |

---

# 10. Open decisions and clarification questions

These decisions should be resolved before the implementation baseline is approved:

1. What are the complete user stories and acceptance criteria after US-301 in the requirements document?
2. What are the authoritative definitions of NFR-002 through NFR-007?
3. What constitutes a **critical defect**, and who owns taxonomy/rule approval?
4. Is a critical defect always grounded immediately, or are there vehicle/category-specific exceptions?
5. What exact system is authoritative for:
   - Vehicle status
   - Trip-start authorization
   - Vehicle location
   - Service-plan configuration
6. What notification channels and paging service constitute the approved fallback sequence?
7. What is the required export format: PDF, CSV, JSON, or a bundled evidence package?
8. What is the approved retention, deletion, legal-hold, and data-residency policy?
9. What permissions allow a controller to amend an AI-proposed taxonomy?
10. What qualifications and role groups define a competent person for release?
11. How should an offline critical defect be handled when the vehicle cannot yet be grounded in the fleet-management system?
12. What is the accepted conflict policy when an offline inspection is submitted after another inspection or trip event?
13. Are post-trip inspections mandatory for all vehicles or only selected vehicle categories?
14. What vehicle location source is available at inspection time?
15. Are existing fleet availability dashboards being extended, or is the compliance view separate?

---

# 11. Traceability summary

| Business requirement / UX input | Proposed coverage |
|---|---|
| Guided vehicle-specific inspection | FEAT-01, US-101, US-103, SCR-01 |
| Failed item requires evidence | US-101, US-501 |
| Immutable inspection record | US-102, US-601 |
| Offline capture and synchronization | US-102, US-501, US-502 |
| Automatic grounding for critical defects | US-201 |
| Driver do-not-drive message | US-201, SCR-02 |
| Trip-start prevention | US-201 |
| Workshop routing and notification | US-202, US-301 |
| Repair and parts recording | US-302 |
| Competent-person release | US-303, SCR-03 |
| Usage-based service planning | US-401, US-402, SCR-04 |
| Compliance evidence export | US-403 |
| Foundry classification with human review | US-203 |
| APIM for all model traffic | US-203, NFR-005 |
| Seven-year immutable evidence | US-601, NFR-006 |
| Entra ID and device compliance | US-602, NFR-008 |
| Two-region App Service architecture | NFR-008 and implementation foundation |

---

# 12. Proposed approval gates

## Gate A — Requirements baseline approval

Approval required from:

- Head of Fleet Operations
- Fleet Compliance
- Product owner
- Technical owner
- Security/identity owner
- Integration Platform owner

Approve:

- Scope and out-of-scope boundaries
- Feature and story decomposition
- Critical-defect taxonomy and grounding policy
- Release-to-service authorization policy
- Complete NFR definitions
- Success-measure calculation rules

## Gate B — Architecture and integration approval

Approve:

- Fleet-management status and trip-start contracts
- Telematics data contracts
- Notification and escalation design
- Offline synchronization and idempotency design
- Azure SQL and Blob Storage evidence model
- APIM and Foundry workflow boundaries
- Identity, authorization, retention, and audit design

## Gate C — Dev readiness approval

Approve:

- Test data and integration mocks
- Dev environment configuration
- Deployment pipeline and environment protection
- Monitoring and alerting
- Accessibility and field-test plan
- Resilience and fail-closed safety tests

## Recommendation

**Do not proceed to code generation or implementation baseline approval until the complete draft documents are reviewed and the open safety, integration, taxonomy, retention, and NFR decisions are resolved.**