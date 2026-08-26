# STORY-P004-003: Registration status gate

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P004-003` |
| Epic | [EPIC-P004](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-onboarding` |
| Minimum plan | `FREE+` |

## Overview

GET /pharmacy/registration-status drives the stepper: missing docs, submitted, rejected reason, active.

**Business value:** Owners know why they cannot go online yet.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/onboarding/status`

**Screens / states**

- Status stepper

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Status view
- Poll/refresh button (no websocket)

### Out of scope

- Admin notes APIs

## Business rules

1. Map PENDING_KYC, KYC_SUBMITTED, ACTIVE, REJECTED, SUSPENDED from payload — field names as Core returns.
2. Refresh is explicit or interval ≥ 30s; no tight loop.
3. Rejected shows Core reason if provided.
4. ACTIVE CTA goes to `/`.
5. Staff can read status.
6. Do not fake percent-complete except profile completeness endpoint (P005).

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/registration-status` | Bearer | UNAUTHORIZED |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given PENDING_KYC, when page loads, then CTA to `/onboarding/kyc` is shown.
2. **AC-002**: Given KYC_SUBMITTED, when loaded, then waiting copy is shown and marketplace nav is still blocked by guard.
3. **AC-003**: Given REJECTED, when reason present, then it is displayed.
4. **AC-004**: Given ACTIVE, when loaded, then Continue opens `/`.
5. **AC-005**: Given Refresh, when clicked, then GET runs again.
6. **AC-006**: Given 401, when loaded, then login.
7. **AC-007**: Given SUSPENDED, when loaded, then suspension copy is shown.
8. **AC-008**: Given polling, when enabled, then interval is ≥ 30 seconds.

## Test requirements

- Unit: Status mapping
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Pending shows KYC CTA
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- EPIC-P003
- Core EPIC-003

**Implemented Core references**

- EPIC-003 STORY-001

**Shared portal requirements**

- `PRODUCT-IDEOLOGY.md`
- `PERSONAS-RBAC-PLAN-MATRIX.md`
- `API-INTEGRATION-CONTRACT.md`
- `DOMAIN-STATE-MACHINES.md`
- `ERROR-AND-RECOVERY-CATALOG.md`
- `UX-ACCESSIBILITY-STANDARDS.md`
- `NON-FUNCTIONAL-REQUIREMENTS.md`

## Notes

- No additional implementation notes.
