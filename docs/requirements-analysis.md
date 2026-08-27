# Requirements Agent — Plan-Stage Reviewable Proposal

**Project:** Fleet Inspection and Maintenance  
**Environment:** Dev  
**Plan date:** 27 August 2026  
**Source status:** Supplied intake documents are marked **Draft v1.0**, dated 24 August 2026. No approved artifacts were supplied. This is therefore a **reviewable proposal**, not an implementation authorization.

---

## 1. Proposed outcome

Deliver a digital fleet inspection and maintenance capability that:

1. Guides drivers through the correct vehicle-specific inspection.
2. Captures immutable inspection and photographic evidence, including offline capture.
3. Grounds a vehicle when a critical defect is recorded and prevents trip start.
4. Routes defects and evidence to the workshop.
5. Records repair and competent release back to service.
6. Calculates usage-based servicing from odometer and engine-hour readings.
7. Exports roadworthiness and maintenance compliance evidence.

### Success measures

| Measure | Target |
|---|---:|
| Critical defects grounded before next use | 100% |
| Median defect report to workshop job creation | ≤ 2 hours, reduced from 3.5 days |
| Vehicles with complete inspection evidence for audited period | 99% |
| Services completed within usage-based due window | 92%, increased from 71% |

---

## 2. Proposed epic and feature hierarchy

### EPIC-01 — Fleet Inspection and Maintenance

**Outcome:** As the fleet operations team, we need drivers to complete guided inspections that ground unsafe vehicles automatically and route defects to the workshop, so that unsafe vehicles are not driven and roadworthiness can be evidenced.

| Feature | Description | Primary users |
|---|---|---|
| FEAT-01 Guided Vehicle Inspection | Vehicle-specific daily pre-trip and post-trip inspections with odometer and evidence capture | Driver, compliance manager |
| FEAT-02 Defect Grounding and Notification | Critical-defect grounding, driver warning, workshop routing and escalation | Driver, workshop controller, duty manager |
| FEAT-03 Workshop Repair and Release | Workshop job creation, repair records, parts, evidence and competent release | Technician, workshop controller |
| FEAT-04 Usage-Based Service and Compliance | Usage-based service calculation, due-window notifications and evidence export | Planner, compliance manager |
| FEAT-05 Offline Synchronisation and Evidence Integrity | Reliable offline capture, reconciliation, immutable evidence and sync monitoring | Driver, operations, compliance |

FEAT-05 is proposed as a cross-cutting feature because offline capture and evidence integrity are material business outcomes, not only technical implementation details.

---

## 3. Proposed user stories and acceptance criteria

### FEAT-01 — Guided Vehicle Inspection

#### US-101 — Load the correct checklist

**As a driver,** I want a guided checklist matched to the vehicle I am about to drive, so that I inspect the right items in the right order.

**Acceptance criteria**

- Given a driver scans or selects a vehicle, when the inspection opens, then the system confirms the vehicle identifier, type and regulatory category.
- The checklist matches the configured vehicle type and regulatory category.
- The odometer is requested before checklist items are shown.
- Every item is presented individually in a defined sequence.
- A vehicle not assigned to the driver requires an explicit confirmation before continuing.
- Manual vehicle registration is available if scanning is unavailable.
- Every item requires an explicit pass or fail outcome.
- A failed item requires a photograph and a description of at least 15 characters before the driver can advance.
- Inspection progress and remaining required items remain visible.

#### US-102 — Record immutable inspection evidence

**As a fleet compliance manager,** I want every inspection recorded against the driver, vehicle, time and odometer, so that roadworthiness evidence is complete without manual assembly.

**Acceptance criteria**

- A submitted inspection records driver identity, vehicle, timestamp, odometer, checklist version, item outcomes, descriptions and evidence references.
- Submitted inspection records cannot be edited or silently overwritten.
- Amendments, corrections or post-submission annotations, if permitted, create a separate auditable record.
- The source of the odometer reading is recorded as telematics or manual entry.
- A manual odometer reading lower than the last recorded reading is blocked unless an explanation is supplied and the exception is recorded.
- An offline submission preserves the original capture time and queues for synchronisation.
- A queued inspection synchronises within five minutes of connectivity returning, subject to service availability.
- Duplicate synchronisation does not create duplicate inspections or grounding events.

#### US-103 — Complete a post-trip inspection

**As a driver,** I want to complete a post-trip inspection, so that defects arising during use are recorded before the vehicle is returned.

**Acceptance criteria**

- The driver can initiate a post-trip inspection for an eligible vehicle and trip.
- The post-trip checklist uses the configured checklist for that vehicle.
- The final odometer reading is captured and validated against the prior recorded reading.
- Defects and evidence follow the same mandatory evidence rules as pre-trip inspections.
- A critical post-trip defect invokes the same grounding and notification process as a pre-trip defect.

---

### FEAT-02 — Defect Grounding and Notification

#### US-201 — Ground a vehicle for a critical defect

**As a driver,** I want to be told clearly and immediately when a defect grounds the vehicle, so that I do not drive something unsafe.

**Acceptance criteria**

- Given a defect is classified as critical under the approved defect taxonomy, when the inspection is submitted, then the vehicle is placed into `Grounded` status.
- The driver sees a persistent, plain-language **“Do not drive”** message.
- The grounding message cannot be dismissed by the driver.
- A trip cannot be started against a grounded vehicle.
- An attempt to start a trip against a grounded vehicle repeats the warning.
- The grounding event is idempotent and has a unique correlation or idempotency key.
- If the fleet-management status update fails, the driver still sees the do-not-drive message.
- If grounding integration fails, the duty manager is alerted within 60 seconds and the event remains pending until resolved.
- The system records all grounding attempts, outcomes and resolution actions.

#### US-202 — Route critical defects to the workshop

**As a workshop controller,** I want critical defects to reach me immediately with evidence attached, so that repair can start without a phone call.

**Acceptance criteria**

- A critical defect produces or links to a workshop job.
- The job contains the failed item, description, photographs, vehicle, location, driver, inspection timestamp and odometer.
- The workshop controller and duty manager receive the defect and evidence within five minutes, subject to notification-service availability.
- Notification recipients and delivery outcomes are visible to authorized users.
- If the primary notification channel fails, the configured fallback channel is attempted.
- Every notification attempt is logged with time, channel, recipient, outcome and correlation ID.
- If all channels fail within five minutes, the duty manager is paged or otherwise escalated according to the approved escalation policy.
- The driver can see whether the workshop notification is pending, delivered or retrying.

#### US-203 — Handle non-critical defects

**As a fleet operations user,** I want non-critical defects recorded and triaged without incorrectly grounding vehicles, so that safety controls are proportionate.

**Acceptance criteria**

- A non-critical defect is recorded against the inspection and vehicle.
- The approved taxonomy determines whether the defect is critical, non-critical or requires review.
- Non-critical defects are routed to the configured workshop queue.
- The vehicle is not automatically grounded unless the approved business rule requires it.
- The system supports a controller escalation from non-critical to critical, with an audit record.
- Any status change that affects vehicle availability is propagated to the fleet-management system.

---

### FEAT-03 — Workshop Repair and Release

#### US-301 — View the defect in a workshop job

**As a workshop technician,** I want the defect, evidence and vehicle history in the job, so that I can diagnose before the vehicle arrives on the ramp.

**Acceptance criteria**

- A workshop job created from a defect links to the source inspection and defect.
- The technician can view the original checklist item, description, photographs, odometer, location and timestamps.
- Relevant vehicle maintenance history and current grounding state are available.
- The job has a clear status, such as `Open`, `In Progress`, `Awaiting Parts`, `Ready for Release` or `Closed`.
- Access is restricted to authorized workshop and fleet users.

#### US-302 — Record repair and parts

**As a workshop technician,** I want to record the repair and parts used, so that maintenance history is complete.

**Acceptance criteria**

- The technician can record diagnosis, repair action, parts, labor or service notes, completion time and odometer.
- Required fields are validated before the job can be marked ready for release.
- Repair evidence, including photographs or documents where required, is stored against the job.
- Repair records cannot alter the original inspection evidence.
- All changes are auditable by user and timestamp.

#### US-303 — Release a vehicle back to service

**As a competent workshop controller,** I want to release a repaired vehicle back to service, so that only an authorized person can clear a grounding.

**Acceptance criteria**

- Only an authorized and competent user can perform release.
- Release requires confirmation that the defect has been repaired or otherwise dispositioned under an approved process.
- Post-repair check evidence is captured where required.
- The release records user, role or competency reference, timestamp, vehicle, defect and evidence.
- The vehicle is not cleared until the fleet-management status update succeeds or an approved manual-resolution process is invoked.
- A released vehicle can be used for a subsequent trip.
- The driver receives or can view the updated safe-to-drive status.
- A release cannot be applied to an unrelated grounding event.

---

### FEAT-04 — Usage-Based Service and Compliance

#### US-401 — Maintain a usage-based service plan

**As a fleet planner,** I want service due dates calculated from actual usage, so that vehicles are serviced according to need rather than calendar dates.

**Acceptance criteria**

- The service plan is sourced from or reconciled with the fleet-management system of record.
- Odometer and engine-hour readings are retrieved from telematics where available.
- The system calculates next-service thresholds using the approved vehicle/service-plan rules.
- A 15-minute telematics tolerance is supported.
- If telematics is unavailable, a manual reading may be used and is clearly flagged.
- Reconciled telematics readings are recorded without losing the original manual reading.
- Due, approaching-due and overdue states are visible to authorized planners.
- The calculator is repeatable and produces the same result for the same inputs and rule version.

#### US-402 — Notify users of service due windows

**As a fleet planner,** I want due-window notifications, so that services are scheduled before non-compliance occurs.

**Acceptance criteria**

- Notifications are generated when a vehicle enters the configured due window.
- Notifications identify the vehicle, service type, current usage, threshold, due window and source readings.
- Duplicate notifications are suppressed according to an approved policy.
- Notification delivery and failures are logged.
- A planner can acknowledge, schedule or resolve the service reminder.
- Overdue services remain visible until resolved or formally dispositioned.

#### US-403 — Export compliance evidence

**As a compliance manager,** I want to export inspection and maintenance evidence for an audited period, so that roadworthiness can be demonstrated on demand.

**Acceptance criteria**

- An authorized user can select a vehicle or fleet and an audited date range.
- The export includes inspections, checklist versions, item outcomes, defects, photographs or evidence references, grounding events, notifications, repairs, releases and service status as applicable.
- The export identifies missing or incomplete records rather than silently omitting them.
- Evidence is traceable to the driver, vehicle, timestamps and source systems.
- Export generation is logged, including requester, scope, time and result.
- Exported evidence is read-only and preserves the original record integrity.
- Records are retained for seven years, subject to the approved retention and legal policy.

---

### FEAT-05 — Offline Synchronisation and Evidence Integrity

#### US-501 — Capture inspections offline

**As a driver,** I want to complete an inspection without connectivity, so that a dead spot does not cause the inspection to be lost.

**Acceptance criteria**

- The correct checklist is available from locally cached, versioned configuration.
- The driver can capture outcomes, descriptions, photographs and odometer while offline.
- The client clearly indicates offline or queued status.
- The local queue survives application restart and temporary device loss scenarios supported by the approved device-management policy.
- The inspection is encrypted in transit and at rest according to the approved security standard.
- Synchronisation resumes automatically when connectivity returns.
- Conflicts are detected and placed into an operational resolution queue rather than silently overwritten.

#### US-502 — Preserve submitted evidence

**As a compliance manager,** I want submitted evidence to be immutable, so that inspection records remain credible during an audit.

**Acceptance criteria**

- Submitted photographs and post-repair evidence cannot be replaced or deleted through normal user functions.
- Blob objects are stored using the approved immutable-retention configuration.
- Evidence references include integrity metadata sufficient to detect alteration.
- Access and download activity is auditable.
- Retention and deletion operations require an approved policy and privileged process.

---

## 4. Cross-cutting non-functional requirements

The supplied documents reference NFR-002 through NFR-007 but do not provide their complete definitions in the available text. The following are proposed baseline NFRs for confirmation.

| ID | Proposed requirement | Verification |
|---|---|---|
| NFR-001 | Grounding and inspection submission must be transactional and idempotent; no accepted critical defect may be lost | API, integration and failure-injection tests |
| NFR-002 | Grounding integration timeout is three seconds; retry and manual-resolution behavior is observable | Contract and resilience tests |
| NFR-003 | Offline inspection synchronises within five minutes of reconnection under normal service conditions | Device and network simulation |
| NFR-004 | Notification dispatch target is within five minutes; duty-manager escalation occurs within the approved failure window | End-to-end notification test |
| NFR-005 | Submitted inspection and evidence records are immutable and retained for seven years | Storage configuration and audit tests |
| NFR-006 | Client supports accessible, one-handed operation in outdoor conditions, including text labels, assertive errors and non-colour severity indicators | Accessibility and usability testing |
| NFR-007 | All model traffic is routed through APIM using managed identity, quotas, content safety, correlation headers and observability | Architecture and gateway verification |
| NFR-008 | Identity uses Entra ID and approved conditional-access policy; shared devices require named per-driver sign-in | Security and identity testing |
| NFR-009 | The solution uses Angular 18/Ionic 8, Python 3.12/FastAPI, Azure SQL, Blob Storage, App Service Premium v3, Functions, Front Door, APIM and Foundry/Microsoft Agent Framework unless an approved change is recorded | Architecture review |
| NFR-010 | Production-like Dev environments use CI/CD provenance, protected environment approvals, managed identities and no embedded secrets | Pipeline and security review |

---

## 5. Proposed technical decomposition

### Backend and data

- Inspection service APIs in FastAPI.
- Azure SQL entities:
  - Vehicle reference
  - Checklist and checklist version
  - Inspection
  - Inspection item result
  - Defect
  - Grounding event
  - Workshop job
  - Repair record
  - Release record
  - Service plan and usage reading
  - Notification attempt
  - Audit event
  - Synchronisation record
- Azure Blob Storage for photographs and post-repair evidence.
- Immutable storage and seven-year retention configuration.
- Idempotency and correlation identifiers across inspection, grounding, notification and sync operations.

### Client

- Angular 18 and Ionic 8 shared client.
- Driver handheld flow.
- Workshop tablet/web flow.
- Planner and compliance web flow.
- Camera capture.
- Service worker and encrypted offline queue.
- Accessibility support for dark, wet and gloved-use conditions.

### Integrations

- Fleet-management system for vehicle status and service-plan system of record.
- Telematics for odometer and engine-hour readings.
- Microsoft Graph and Teams for notifications.
- Azure API Management for all model traffic.
- Microsoft Foundry and Microsoft Agent Framework for defect classification workflow.

### Agent workflow

Proposed safe boundary:

1. Driver submits free-text defect description.
2. Classification agent proposes taxonomy and confidence.
3. Workflow pauses for workshop-controller review.
4. Approved taxonomy is recorded.
5. Deterministic business rules apply grounding severity.
6. All model inputs, outputs, reviewer decision and correlation identifiers are logged.

**Important:** The model must not independently determine or clear a vehicle grounding status. The grounding rule should be deterministic and based on approved taxonomy/configuration. This is a proposed clarification because the requirements say grounding is automatic, while the technical requirements require human confirmation of model classification.

---

## 6. Delivery sequence and tasks

### Phase 0 — Resolve requirements and architecture decisions

- Confirm approved requirements and UX versions.
- Obtain complete technical requirements, including the truncated API and NFR sections.
- Define defect taxonomy, criticality rules and checklist ownership.
- Confirm whether criticality comes from checklist configuration, controller review, or both.
- Define vehicle-status API contract and trip-start enforcement boundary.
- Define notification recipients, fallback order and paging policy.
- Confirm retention, legal hold and deletion policy.
- Confirm offline-device loss and local data-protection expectations.
- Approve the Dev environment architecture and integration test doubles.

### Phase 1 — Foundation

- Create repository, branch protections and CI/CD workflow.
- Configure Dev resources and managed identities.
- Establish APIM route, correlation headers, quotas and monitoring.
- Create Azure SQL schema and migration process.
- Configure Blob Storage, immutability and retention.
- Implement Entra ID roles and authorization model.
- Establish audit-event and operational telemetry patterns.

### Phase 2 — Inspection and offline capture

- Implement checklist configuration and versioning.
- Implement vehicle scan/manual selection.
- Implement odometer validation.
- Implement one-item-at-a-time inspection flow.
- Implement failure descriptions and photo capture.
- Implement local offline queue and sync protocol.
- Implement immutable submission and duplicate protection.
- Build US-101, US-102, US-103 and US-501/502 test coverage.

### Phase 3 — Grounding and notification

- Implement deterministic defect severity rules.
- Implement grounding adapter with idempotency, retries and manual resolution.
- Implement trip-start blocking integration.
- Implement driver grounding state and persistent warning.
- Implement workshop job creation.
- Implement Graph/Teams notification dispatcher and fallback.
- Implement delivery audit and escalation.
- Execute failure-injection tests for grounding and notification failures.

### Phase 4 — Workshop repair and release

- Implement workshop queue and job detail.
- Implement repair and parts recording.
- Implement post-repair evidence.
- Implement competency-based release authorization.
- Implement release-to-fleet-management integration.
- Test that release cannot occur without required authorization and evidence.

### Phase 5 — Service plans and compliance

- Implement telematics usage ingestion.
- Implement manual-reading fallback and reconciliation.
- Implement service-plan calculation.
- Implement due-window notifications.
- Implement compliance evidence export.
- Validate seven-year evidence retrieval and incomplete-record reporting.

### Phase 6 — Integrated verification and Dev readiness

- Run end-to-end pre-trip, grounding, repair and release scenarios.
- Test offline capture, reconnection, duplicate sync and conflict handling.
- Test degraded fleet-management, telematics, notification and model services.
- Conduct accessibility and outdoor-device usability testing.
- Conduct security, privacy and authorization testing.
- Produce deployment, support, monitoring and operational runbooks.
- Submit release candidate for human approval.

---

## 7. Dependencies

| Dependency | Impact | Required decision/owner |
|---|---|---|
| Fleet-management vehicle-status API | Grounding and release cannot be authoritative without a confirmed contract | Integration Platform / Fleet Systems |
| Fleet-management service-plan data | Usage-based scheduling depends on authoritative plan definitions | Fleet Systems |
| Trip-start enforcement API | Preventing use of grounded vehicles requires an enforcement point | Fleet Systems / Dispatch owner |
| Telematics odometer and engine-hour feed | Required for usage-based service and reading reconciliation | Telematics owner |
| Defect taxonomy and criticality rules | Required for deterministic grounding | Head of Fleet Operations / Compliance |
| Checklist catalogue by vehicle type and regulatory category | Required to load correct inspection | Fleet Compliance |
| Notification recipients and escalation policy | Required for workshop/duty-manager routing | Fleet Operations |
| Entra ID, Intune and shared-device policy | Required for attributable driver identity | Security / Endpoint Management |
| APIM and Foundry model deployment | Required for classification workflow | AI Engineering |
| Retention and legal policy | Required for seven-year immutable evidence | Compliance / Legal |
| UX wireframes and accessibility sign-off | Required before client implementation is considered complete | Product / UX |

---

## 8. Risks and mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Fleet-status integration fails while a vehicle is grounded | Critical | Show do-not-drive locally, alert duty manager within 60 seconds, retry with idempotency, provide manual resolution |
| Model misclassifies a defect | Critical | Make model advisory only; require controller review; apply deterministic grounding rules; retain model audit trail |
| Offline device is lost before synchronisation | High | Encrypt local queue, minimize retained data, use managed devices, define recovery policy and show unsynchronised-record monitoring |
| Notification delivery fails | High | Multi-channel fallback, five-minute escalation, delivery audit and operational alerting |
| Checklist or taxonomy changes invalidate evidence | High | Version checklists and taxonomies; preserve versions on every submitted record |
| Manual odometer readings are inaccurate | Medium | Validate against prior reading, flag manual source, reconcile with telematics and audit corrections |
| Release is performed by an unauthorized user | Critical | Entra role and competency authorization, server-side enforcement, release audit record |
| Seven-year immutable retention is misconfigured | High | Infrastructure-as-code, policy checks, retention verification and periodic restore/readability tests |
| Scope expands into dispatch, telematics analytics or other excluded areas | Medium | Maintain explicit out-of-scope boundary and change-control approval |
| UX is difficult in rain, darkness or with gloves | Medium | Device testing in representative conditions, large controls, assertive text, one-handed flow and accessibility testing |
| Active-active regional behavior causes duplicate or conflicting grounding events | High | Define transaction/idempotency strategy, test regional failover and reconcile system-of-record status |

---

## 9. Open questions and approval gates

The following require product, compliance, security or architecture confirmation before implementation is authorized:

1. **Requirements completeness:** Provide the complete requirements and technical-requirements text, especially the truncated sections and referenced NFR definitions.
2. **Criticality authority:** Is criticality determined solely by checklist configuration, by a controller, or by a combination?
3. **AI approval timing:** The business requirement implies immediate grounding, while the technical requirement pauses for controller review. Which path applies to a defect that may be critical?
4. **Grounding authority:** Does the fleet-management system remain the authoritative vehicle-status system, or does this service hold an authoritative pending-grounding state?
5. **Trip-start enforcement:** Which system blocks trip start, and what is the behavior during integration outage?
6. **Post-trip scope:** Are post-trip inspections required for every vehicle and trip or only configured vehicle categories?
7. **Notification policy:** Confirm recipients, fallback channel order, duty-manager paging mechanism and working-hours behavior.
8. **Competency model:** Define which roles may release vehicles and how competency validity is verified.
9. **Evidence policy:** Confirm legal retention, geographic storage, legal hold, export format and authorized access.
10. **Offline security:** Confirm acceptable local retention duration and behavior if a device is lost or a driver signs out.
11. **Service-plan rules:** Confirm thresholds, due windows, engine-hour treatment and precedence between manual and telematics readings.
12. **Integration availability:** Confirm Dev test endpoints, credentials through approved secret-management mechanisms, rate limits and test data.
13. **Success-measure baselines:** Confirm how the stated targets will be measured and which dashboards or reports are authoritative.

---

## 10. Traceability summary

| Business outcome | Features | Stories |
|---|---|---|
| Stop defective vehicles being driven | FEAT-01, FEAT-02, FEAT-03 | US-101, US-102, US-201, US-202, US-203, US-303 |
| Shorten defect-to-repair time | FEAT-02, FEAT-03 | US-202, US-301, US-302 |
| Evidence roadworthiness on demand | FEAT-01, FEAT-03, FEAT-04, FEAT-05 | US-102, US-301, US-303, US-403, US-502 |
| Service on usage rather than calendar | FEAT-04 | US-401, US-402, US-403 |
| Operate roadside without connectivity | FEAT-01, FEAT-05 | US-102, US-103, US-501, US-502 |
| Safe and governed AI assistance | FEAT-02 and cross-cutting architecture | US-203 plus NFR-007 and the proposed human-review workflow |

---

## 11. Recommendation

Proceed to **requirements clarification and architecture elaboration in Dev**, but do not authorize code generation until the following are approved:

- Complete and non-truncated requirements baseline.
- Critical-defect and grounding decision model.
- Fleet-management and trip-start integration contracts.
- Notification escalation policy.
- Defect taxonomy, checklist ownership and competency rules.
- Security, retention and offline-device policies.
- NFR baseline and measurable service-level targets.

This proposal is ready for review by Fleet Operations, Compliance, Fleet Systems, Integration Platform, Security, UX and AI Engineering.