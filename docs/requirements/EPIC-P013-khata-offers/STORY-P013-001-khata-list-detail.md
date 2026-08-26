# STORY-P013-001: Khata list, detail, payment history (Starter+)

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P013-001` |
| Epic | [EPIC-P013](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-billing` |
| Minimum plan | `STARTER+` |

## Overview

GET khata, detail, payment-history. FREE locked.

**Business value:** Neighbourhood credit is visible.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/khata`
- `/khata/:customerId`

**Screens / states**

- Khata list
- Khata detail
- Lock

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- List
- Detail
- History

### Out of scope

- Customer app credit

## Business rules

1. PLAN_FEATURE_LOCKED on FREE.
2. Pagination.
3. Balances from payload.
4. Excel export if Bruno khata/export-excel exists.
5. Empty state.
6. Reminders are a separate story.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/khata` | Bearer | PLAN_FEATURE_LOCKED, MODULE_NOT_IN_PLAN |
| GET | `/api/v1/pharmacy/khata/payment-history` | Bearer | PLAN_FEATURE_LOCKED, MODULE_NOT_IN_PLAN |
| GET | `/api/v1/pharmacy/khata/{customerId}` | Bearer | PLAN_FEATURE_LOCKED, CUSTOMER_NOT_FOUND, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given FREE, when /khata, then lock Starter+.
2. **AC-002**: Given STARTER, when GET list, then rows.
3. **AC-003**: Given detail, when customerId, then GET detail.
4. **AC-004**: Given payment-history, when opened, then rows.
5. **AC-005**: Given export if present, when clicked, then download.
6. **AC-006**: Given 404, when unknown customer, then not-found.
7. **AC-007**: Given empty, when no debtors, then empty.
8. **AC-008**: Given a11y, when balances, then not colour-only.

## Test requirements

- Unit: Free lock
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Detail
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
