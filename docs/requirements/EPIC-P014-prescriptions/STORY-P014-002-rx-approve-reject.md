# STORY-P014-002: Approve and reject prescriptions

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P014-002` |
| Epic | [EPIC-P014](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-rx` |
| Minimum plan | `STARTER+` |

## Overview

POST approve/reject with reason DTO on reject.

**Business value:** Only valid Rx become bills.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/prescriptions/:rxId`

**Screens / states**

- Approve
- Reject

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Approve
- Reject confirm

### Out of scope

- Client-side order line edits

## Business rules

1. Reject requires reason if Core requires.
2. Approve may set order lines — eventual note.
3. Illegal state errors.
4. All authenticated pharmacy owners and staff may approve or reject; no pharmacist permission is enforced by Core.
5. Confirm reject.
6. Schedule X extra fields if Core errors.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/pharmacy/prescriptions/{rxId}/approve` | Bearer | PLAN_UPGRADE_REQUIRED, VALIDATION_ERROR |
| POST | `/api/v1/pharmacy/prescriptions/{rxId}/reject` | Bearer | PLAN_UPGRADE_REQUIRED, VALIDATION_ERROR |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given PENDING_REVIEW, when approve succeeds, then status APPROVED on refresh.
2. **AC-002**: Given reject, when reason required, then POST includes it.
3. **AC-003**: Given confirm reject cancel, when cancelled, then no POST.
4. **AC-004**: Given already dispensed, when approve, then Core error.
5. **AC-005**: Given FREE, when called, then lock.
6. **AC-006**: Given keyboard, when approve vs reject, then distinct controls.
7. **AC-007**: Given cashier 403, when hidden.
8. **AC-008**: Given a11y, when reason, then labelled.

## Test requirements

- Unit: Reject reason
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Approve
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-008 STORY-002/004

**Implemented Core references**

- EPIC-008 STORY-002

**Shared portal requirements**

- `PRODUCT-IDEOLOGY.md`
- `PERSONAS-RBAC-PLAN-MATRIX.md`
- `API-INTEGRATION-CONTRACT.md`
- `DOMAIN-STATE-MACHINES.md`
- `ERROR-AND-RECOVERY-CATALOG.md`
- `UX-ACCESSIBILITY-STANDARDS.md`
- `NON-FUNCTIONAL-REQUIREMENTS.md`

## Notes

- Approve/reject with a labelled reject reason; cashier and staff without `prescriptions:verify` hide mutate actions.
