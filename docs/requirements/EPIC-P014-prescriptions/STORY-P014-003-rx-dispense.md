# STORY-P014-003: Dispense and dispense-to-billing

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P014-003` |
| Epic | [EPIC-P014](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-rx` |
| Minimum plan | `STARTER+` |

## Overview

POST dispense and dispense-to-billing. Route to POS if cart id returned.

**Business value:** H1/X register gets a row and the counter can bill.

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
- `/pos`

**Screens / states**

- Dispense confirm

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Dispense
- Handoff

### Out of scope

- Inventing cart APIs

## Business rules

1. Dispense records register via Core.
2. Navigate /pos if payload has cart_id.
3. INSUFFICIENT_STOCK possible.
4. Confirm controlled drugs.
5. Do not skip approve if Core requires it first.
6. All authenticated pharmacy owners and staff may dispense; no pharmacist permission is enforced by Core.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/pharmacy/prescriptions/{rxId}/dispense` | Bearer | PLAN_UPGRADE_REQUIRED, INSUFFICIENT_STOCK, VALIDATION_ERROR |
| POST | `/api/v1/pharmacy/prescriptions/{rxId}/dispense-to-billing` | Bearer | PLAN_UPGRADE_REQUIRED, VALIDATION_ERROR |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given APPROVED, when dispense succeeds, then DISPENSED.
2. **AC-002**: Given dispense-to-billing, when cart_id returned, then navigate /pos.
3. **AC-003**: Given INSUFFICIENT_STOCK, when dispense, then error.
4. **AC-004**: Given PENDING_REVIEW, when dispense, then Core error.
5. **AC-005**: Given H1/X, when confirm, then extra copy.
6. **AC-006**: Given no cart_id, when handoff, then stay with success message.
7. **AC-007**: Given cashier, when hidden.
8. **AC-008**: Given a11y, when confirm, then labelled.

## Test requirements

- Unit: Handoff to POS
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Stock error
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

- Core's current PosDispensePort bridge returns generated identifiers and does not create a real POS cart. Treat dispense-to-billing as integration-blocked until GAP-017 is closed; direct dispense remains implementable.
