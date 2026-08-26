# STORY-P013-002: Khata repayment and reminders

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P013-002` |
| Epic | [EPIC-P013](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-billing` |
| Minimum plan | `STARTER+` |

## Overview

POST repayment and remind. Reminders typically owner-only.

**Business value:** Collections without a paper register.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/khata/:customerId`

**Screens / states**

- Repay dialog
- Remind

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Repay form
- Remind

### Out of scope

- WhatsApp if Core only SMS/FCM

## Business rules

1. Idempotency on repayment.
2. Remind owner-only if Core 403s staff.
3. Amount as DTO (paise).
4. PLAN_FEATURE_LOCKED FREE.
5. Success refreshes detail.
6. No invented SMS copy.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/pharmacy/khata/{customerId}/repayment` | Bearer | PLAN_FEATURE_LOCKED, VALIDATION_ERROR, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/khata/{customerId}/remind` | Bearer owner | PLAN_FEATURE_LOCKED, FORBIDDEN, STAFF_CANNOT_REMIND, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given STARTER owner, when repayment valid, then history updates.
2. **AC-002**: Given FREE, when repay, then lock.
3. **AC-003**: Given staff, when remind hidden, then no POST.
4. **AC-004**: Given owner remind, when POST, then success from Core.
5. **AC-005**: Given invalid amount, when VALIDATION_ERROR, then field error.
6. **AC-006**: Given double repay click, when idempotency, then one intent.
7. **AC-007**: Given 403 remind, when shown, then forbidden.
8. **AC-008**: Given a11y, when amount, then labelled.

## Test requirements

- Unit: Repay idempotency
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Remind owner-only
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-007 STORY-003/005

**Implemented Core references**

- EPIC-007 STORY-003

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
