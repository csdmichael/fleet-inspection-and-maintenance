# Architecture Advisor Agent – Design Stage Proposal
**Project:** Fleet Inspection And Maintenance  
**Environment:** Dev  
**Date:** 2026-08-30  
**Status:** Reviewable Proposal

---

## 1. Solution Architecture Overview

**Objective:**  
Digitize fleet vehicle inspections, enforce automatic grounding on critical defects, route defects instantly to the workshop, and maintain usage-based service plans with immutable evidence.

**Architecture Pattern:**  
- Mobile-first, offline-capable client (Ionic/Angular)
- Python FastAPI service layer
- Azure SQL Database for transactional records
- Azure Blob Storage for evidence
- Azure App Service (Premium v3, active-active)
- Azure API Management (APIM) for all AI/model traffic
- Microsoft Foundry Agent Framework for defect classification
- Integration with Fleet Management System (vehicle status, service plans)
- Microsoft Entra ID for identity and conditional access

---

## 2. Architecture Decision Records (ADR)

### ADR-01: Frontend Technology
- **Decision:** Angular 18 + Ionic 8 (TypeScript)
- **Rationale:** Unified codebase for handheld, tablet, and browser; robust offline support; camera integration.
- **Alternatives:** React Native, Flutter (not selected due to platform standards and offline requirements).

### ADR-02: API Layer
- **Decision:** Python 3.12 FastAPI
- **Rationale:** Typed models, explicit grounding logic, platform standard.
- **Alternatives:** Node.js, .NET (not selected due to team expertise and Python model integration).

### ADR-03: Database
- **Decision:** Azure SQL Database
- **Rationale:** Relational, transactional integrity for inspections and grounding events.
- **Alternatives:** Azure Cosmos DB (not selected due to relational nature of data).

### ADR-04: Evidence Storage
- **Decision:** Azure Blob Storage (immutable, 7-year retention)
- **Rationale:** Regulatory evidence requirements; supports large binary objects.
- **Alternatives:** Local file system, third-party storage (not selected due to compliance and scalability).

### ADR-05: Hosting & Availability
- **Decision:** Azure App Service Premium v3, active-active across two regions, Azure Front Door
- **Rationale:** No maintenance window; high availability.
- **Alternatives:** Single-region hosting (not selected due to downtime risk).

### ADR-06: Agentic Workflow & AI Integration
- **Decision:** Microsoft Foundry Agent Framework via APIM
- **Rationale:** Defect classification, controller review, managed identity, content safety.
- **Alternatives:** Direct model calls (not selected due to governance and cost observability).

### ADR-07: Identity & Access
- **Decision:** Microsoft Entra ID, conditional access, Intune compliance, per-driver sign-in
- **Rationale:** Evidence must be attributable; device compliance enforced.
- **Alternatives:** Custom identity (not selected due to security and audit requirements).

---

## 3. Data & API Contracts

### Inspection Record (Immutable)
```json
{
  "inspectionId": "uuid",
  "vehicleId": "string",
  "driverId": "string",
  "timestamp": "datetime",
  "odometer": "integer",
  "items": [
    {
      "itemId": "string",
      "outcome": "pass|fail",
      "description": "string (min 15 chars if fail)",
      "photoUrl": "string (if fail)"
    }
  ],
  "offlineCapture": "boolean",
  "syncTimestamp": "datetime (if offline)"
}
```

### Defect & Grounding Event
```json
{
  "defectId": "uuid",
  "inspectionId": "uuid",
  "vehicleId": "string",
  "severity": "critical|major|minor",
  "taxonomyCode": "string",
  "description": "string",
  "photoUrl": "string",
  "grounded": "boolean",
  "groundingTimestamp": "datetime",
  "notificationStatus": [
    {
      "recipient": "workshop|dutyManager",
      "channel": "Teams|Mail|SMS",
      "attemptedAt": "datetime",
      "status": "delivered|failed|pending"
    }
  ]
}
```

### Workshop Job
```json
{
  "jobId": "uuid",
  "defectId": "uuid",
  "vehicleId": "string",
  "technicianId": "string",
  "repairActions": [
    {
      "action": "string",
      "partsUsed": ["string"]
    }
  ],
  "releasedBy": "string",
  "releaseTimestamp": "datetime"
}
```

### API Endpoints (Sample)
- `POST /inspections` – Submit inspection (offline queue supported)
- `POST /defects` – Record defect, trigger grounding if critical
- `POST /grounding` – Apply vehicle status via grounding adapter
- `POST /notifications` – Dispatch defect notifications (Teams, Mail, SMS)
- `GET /service-plans/:vehicleId` – Retrieve usage-based service plan
- `POST /defect-classification` – Route free-text defect to Foundry agent via APIM

---

## 4. Threat Model Considerations

- **Offline Data Tampering:**  
  - Inspection records are signed and timestamped; sync reconciles with server.
  - Evidence (photos) are hashed and stored immutably.

- **Grounding Event Reliability:**  
  - Grounding adapter retries until success; driver is always shown do-not-drive if integration fails.
  - Duty manager alerted within 60 seconds if grounding cannot be applied.

- **Notification Delivery:**  
  - Channel fallback (Teams, Mail, SMS); every attempt logged.
  - Duty manager paged if no channel succeeds within 5 minutes.

- **Identity Spoofing:**  
  - Entra ID with conditional access; device compliance enforced.
  - Shared devices require per-driver sign-in.

- **Evidence Integrity:**  
  - Blob storage is immutable; 7-year retention policy.
  - Inspection records cannot be edited post-submission.

- **API Abuse:**  
  - APIM enforces quotas, managed identity, content safety, and correlation headers for all agent/model traffic.

---

## 5. Implementable Technical Plan

### Components & Ownership

| Component           | Technology           | Hosting           | Owner               |
|---------------------|----------------------|-------------------|---------------------|
| Driver Inspection   | Angular 18, Ionic 8  | Android/iOS/Web   | Fleet Systems Team  |
| Inspection Service  | Python 3.12, FastAPI | Azure App Service | Fleet Systems Team  |
| Grounding Adapter   | Python 3.12, FastAPI | Azure App Service | Integration Platform|
| Service Plan Calc   | Python 3.12          | Azure Functions   | Fleet Systems Team  |
| Defect Classifier   | Foundry Agent        | APIM/Foundry      | AI Engineering Team |
| Notification Dispatcher | Python 3.12      | Azure App Service | Fleet Systems Team  |

### Key Implementation Steps

1. **Client App**
   - Build guided checklist UI (one item at a time, evidence on fail)
   - Implement offline capture and sync logic
   - Integrate camera/photo capture, enforce minimum description

2. **API Service**
   - Define inspection, defect, grounding, notification, and workshop job endpoints
   - Enforce immutability and transactional integrity
   - Integrate telematics odometer feed (fallback to manual entry)

3. **Grounding Adapter**
   - Implement vehicle status API integration with retry and alerting
   - Ensure idempotency per grounding event

4. **Notification Dispatcher**
   - Integrate with Microsoft Graph for Teams/Mail/SMS
   - Implement channel fallback and logging

5. **Defect Classification Workflow**
   - Route free-text defect descriptions through APIM to Foundry agent
   - Pause for controller review before taxonomy code is applied

6. **Service Plan Calculator**
   - Project next service from odometer/engine hours
   - Trigger due-window notifications

7. **Security & Compliance**
   - Enforce Entra ID sign-in, device compliance
   - Apply blob storage retention and immutability
   - Log all critical events (grounding, notifications, releases)

---

## 6. Review Checklist

- [ ] All requirements mapped to features and user stories
- [ ] Architecture decisions documented and justified
- [ ] Data and API contracts defined, reviewed for traceability and immutability
- [ ] Threat model covers offline, grounding, notification, evidence, and identity risks
- [ ] Technical plan aligns with approved stack, component boundaries, and integration points
- [ ] No external system changes claimed without tool output
- [ ] No secrets exposed; all input treated as untrusted

---

## 7. References

- [Requirements Document](https://github.com/csdmichael/fleet-inspection-and-maintenance/blob/main/docs/intake/requirements/Fleet-Inspection-And-Maintenance-Requirements.docx)
- [Technical Requirements](https://github.com/csdmichael/fleet-inspection-and-maintenance/blob/main/docs/intake/technical-requirements/Fleet-Inspection-And-Maintenance-Technical-Requirements.docx)
- [UX Mockups](https://github.com/csdmichael/fleet-inspection-and-maintenance/blob/main/docs/intake/ux-mockups/Fleet-Inspection-And-Maintenance-UX-Mockups.docx)
- [Requirements Agent Output](https://github.com/csdmichael/fleet-inspection-and-maintenance/tree/main/docs)

---

**Next Steps:**  
- Human review and approval of this architecture proposal  
- On approval, proceed to code generation and integration planning

---

**Prepared by:** Architecture Advisor Agent  
**For:** Fleet Inspection And Maintenance – Design Stage  
**Status:** Ready for review and approval