# STORY-P012-004: Mark sale paid

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P012-004` |
| Epic | [EPIC-P012](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-billing` |
| Minimum plan | `FREE+` |

## Overview

POST /pharmacy/sales/{saleId}/mark-paid. Hide if Core owner-only.

**Business value:** Later cash collection is recorded.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/sales`

**Screens / states**

- Mark paid dialog

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Mark paid action

### Out of scope

- Khata repayment endpoint

## Business rules

1. Confirm if DTO includes amount.
2. Hide for roles that 403.
3. Idempotency if treated as payment-like.
4. Refresh row after success.
5. Never mark paid locally.
6. Illegal state error shown.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/pharmacy/sales/{saleId}/mark-paid` | Bearer owner | FORBIDDEN, VALIDATION_ERROR, SALE_NOT_FOUND, STAFF_CANNOT_MARK_PAID, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given unpaid sale, when mark-paid succeeds, then status paid on refresh.
2. **AC-002**: Given cashier 403, when hidden, then no action.
3. **AC-003**: Given already paid, when Core errors, then message.
4. **AC-004**: Given confirm cancel, when cancelled, then no POST.
5. **AC-005**: Given a11y, when dialog, then labelled.
6. **AC-006**: Given 500, when failure, then row unchanged.
7. **AC-007**: Given owner, when visible, then action exists.
8. **AC-008**: Given keyboard, when confirm, then Enter submits once.

## Test requirements

- Unit: Mark paid owner
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: 403 cashier
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-007 STORY-002/004

**Implemented Core references**

- EPIC-007 STORY-004

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
