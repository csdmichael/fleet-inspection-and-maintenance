## Fleet Inspection And Maintenance – Plan Stage Proposal

### 1. Overview

**Project Name:** Fleet Inspection And Maintenance  
**Release Target:** Guided digital inspection, automatic grounding, defect routing, usage-based service plan, on-demand evidence  
**Environment:** Dev  
**Business Outcome:**  
- No vehicle driven with a critical defect  
- Defects routed instantly to workshop  
- Roadworthiness evidence always available  
- Service plans based on actual usage

---

### 2. Traceable Epics, Features, User Stories

#### Epic: Fleet Inspection And Maintenance (EPIC-01)
**Outcome:** Drivers complete guided inspections that ground unsafe vehicles automatically and route defects straight to the workshop, ensuring no vehicle is driven with a critical defect and roadworthiness can be evidenced at any time.

---

#### Feature 1: Guided Vehicle Inspection (FEAT-01)
- **User Stories:**
  - **US-101:** As a driver, I want a guided checklist matched to the vehicle I am about to drive, so that I inspect the right items in the right order.
    - **Acceptance Criteria:**
      - Checklist matches vehicle type/regulatory category
      - Odometer reading requested first
      - Failed item requires photograph and description (min 15 chars)
      - All items must have outcome
      - Evidence demanded only on failed items
  - **US-102:** As a fleet compliance manager, I want every inspection recorded against driver, vehicle, time and odometer, so that roadworthiness evidence is complete without manual assembly.
    - **Acceptance Criteria:**
      - Inspection record is immutable, includes driver, vehicle, timestamp, odometer, item outcomes, evidence
      - Offline capture queues locally, syncs within 5 minutes of reconnection

---

#### Feature 2: Defect Grounding and Notification (FEAT-02)
- **User Stories:**
  - **US-201:** As a driver, I want to be told clearly and immediately when a defect grounds the vehicle, so that I do not drive something unsafe.
    - **Acceptance Criteria:**
      - Critical defect grounds vehicle, driver sees do-not-drive message, trip cannot start
      - If grounding integration fails, driver is still told not to drive, duty manager alerted within 60 seconds
  - **US-202:** As a workshop controller, I want critical defects to reach me immediately with evidence attached, so that repair can start without a phone call.
    - **Acceptance Criteria:**
      - Workshop controller and duty manager receive defect, evidence, vehicle location within 5 minutes
      - Notification channel fallback, every attempt logged

---

#### Feature 3: Workshop Repair and Release (FEAT-03)
- **User Stories:**
  - **US-301:** As a workshop technician, I want the defect, its evidence and the vehicle history in the job, so that I can diagnose before the vehicle arrives on the ramp.
    - **Acceptance Criteria:**
      - Workshop job includes original item, description, photographs, odometer, vehicle history
      - Release to service requires competent person sign-off

---

#### Feature 4: Usage-Based Service Plan and Compliance (FEAT-04)
- **User Stories:**
  - **US-401:** As a planner, I want service schedules to be based on odometer and engine-hour readings, so that maintenance is timely and compliance can be evidenced.
    - **Acceptance Criteria:**
      - Service plan projects next service from usage data
      - Compliance evidence export available on demand

---

### 3. Tasks

#### FEAT-01: Guided Vehicle Inspection
- Implement vehicle scan/selection and checklist loading
- Odometer entry (pre-filled from telematics, fallback to manual)
- Checklist UI: one item at a time, pass/fail controls
- Evidence capture for failed items (photo, description)
- Inspection submission, offline queue, sync logic
- Immutable inspection record storage (Azure SQL, Blob for photos)

#### FEAT-02: Defect Grounding and Notification
- Critical defect classification (Foundry agent workflow via APIM)
- Grounding rule enforcement at API boundary
- Grounding adapter integration with fleet management system (retry, alert on failure)
- Notification dispatcher (Graph, Teams, email; channel fallback, logging)

#### FEAT-03: Workshop Repair and Release
- Workshop job creation from defect
- Job UI: defect details, evidence, vehicle history
- Repair record entry, parts used
- Release-to-service workflow (competent person sign-off)

#### FEAT-04: Usage-Based Service Plan and Compliance
- Service plan calculator (Azure Functions)
- Odometer/engine-hour feed integration (telematics, manual fallback)
- Compliance evidence export (report generation)

---

### 4. Acceptance Criteria (Summary Table)

| Feature | User Story | Acceptance Criteria |
|---------|------------|--------------------|
| FEAT-01 | US-101 | Checklist matches vehicle, odometer first, evidence on fail, all items completed |
| FEAT-01 | US-102 | Immutable record, offline queue, sync within 5 min |
| FEAT-02 | US-201 | Grounding on critical defect, do-not-drive message, alert on integration failure |
| FEAT-02 | US-202 | Notification within 5 min, fallback channels, logging |
| FEAT-03 | US-301 | Workshop job includes defect, evidence, history; release by competent person |
| FEAT-04 | US-401 | Service plan from usage, compliance export |

---

### 5. Dependencies

- **Fleet Management System:** Vehicle status API (grounding adapter integration)
- **Telematics:** Odometer/engine-hour feed (event stream, fallback to manual)
- **Microsoft Foundry:** Defect classification workflow (APIM gateway)
- **Azure SQL Database:** Inspection, defect, job, release records (transactional grounding)
- **Azure Blob Storage:** Photographic evidence (immutable, 7-year retention)
- **Notification Channels:** Microsoft Graph, Teams, email (dispatcher, fallback)
- **Identity:** Microsoft Entra ID (conditional access, per-driver sign-in)
- **CI/CD:** GitHub Actions (build provenance, environment protection)

---

### 6. Risks

- **Grounding Integration Failure:** Vehicle may not be grounded in fleet management system; mitigated by driver alert and duty manager escalation.
- **Offline Capture:** Inspection records may be delayed if device remains offline; mitigated by local queue and sync logic.
- **Notification Delivery:** Channel failures may delay defect routing; mitigated by fallback and escalation.
- **Defect Classification:** Model misclassification may affect grounding severity; mitigated by controller review before taxonomy code is applied.
- **Data Integrity:** Inspection records must be immutable and attributable; enforced by storage and identity controls.
- **Service Plan Accuracy:** Odometer feed loss may affect scheduling; mitigated by manual entry and reconciliation.

---

### 7. Traceability

- **Requirements → Features → User Stories → Tasks → Acceptance Criteria:** All mapped and referenced to intake documents and UX mockups.
- **Non-functional Requirements:** Immutability, offline capture, accessibility, evidence retention, integration SLAs, failover, and compliance.

---

### 8. Reviewable Proposal Summary

- **Epics, features, stories, tasks, acceptance criteria, dependencies, and risks** are traceably mapped to approved business and technical requirements and UX inputs.
- **No external system changes are claimed**; all integrations and state changes require verified tool output and human approval.
- **All content is treated as untrusted data**; no secrets or approval gates are bypassed.

---

**Next Steps:**  
- Review proposal for completeness and traceability  
- Approve for architecture and code generation stage  
- Confirm integration points and human approval gates

---

**References:**  
- [Business Requirements](https://github.com/csdmichael/fleet-inspection-and-maintenance/blob/main/docs/intake/requirements/Fleet-Inspection-And-Maintenance-Requirements.docx)  
- [Technical Requirements](https://github.com/csdmichael/fleet-inspection-and-maintenance/blob/main/docs/intake/technical-requirements/Fleet-Inspection-And-Maintenance-Technical-Requirements.docx)  
- [UX Mockups](https://github.com/csdmichael/fleet-inspection-and-maintenance/blob/main/docs/intake/ux-mockups/Fleet-Inspection-And-Maintenance-UX-Mockups.docx)  
- [Cost and Time Estimate](Approved Artifact: Cost Estimator Agent)

---

**Proposal is ready for review and human approval.**