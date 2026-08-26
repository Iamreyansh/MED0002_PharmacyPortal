# STORY-P009-002: Batches, FEFO, expiry alerts, write-off

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P009-002` |
| Epic | [EPIC-P009](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-inventory` |
| Minimum plan | `FREE+` |

## Overview

Batch CRUD under inventory, expiry-alerts, expiry-report, write-off delete/adjust as Core verbs.

**Business value:** Near-expiry stock is visible before POS sells it.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/inventory/:productId`
- `/inventory/expiry`

**Screens / states**

- Batches
- Expiry alerts
- Expiry report

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Batch table
- Add/adjust/write-off
- Expiry views

### Out of scope

- Auto-write-off jobs UI

## Business rules

1. FEFO is Core’s; UI should sort/display expiry dates IST dates.
2. Write-off confirms quantity and reason if DTO has reason.
3. Adjust uses PATCH batch.
4. Expiry alerts from GET expiry-alerts.
5. Report from GET expiry-report.
6. Do not allow negative qty client-only — still handle Core errors.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/inventory/{productId}/batches` | Bearer | PRODUCT_NOT_FOUND, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/inventory/{productId}/batches` | Bearer | VALIDATION_ERROR, MODULE_NOT_IN_PLAN |
| PATCH | `/api/v1/pharmacy/inventory/{productId}/batches/{batchId}` | Bearer | VALIDATION_ERROR, BATCH_NOT_FOUND, MODULE_NOT_IN_PLAN |
| DELETE | `/api/v1/pharmacy/inventory/{productId}/batches/{batchId}` | Bearer owner | FORBIDDEN, VALIDATION_ERROR, BATCH_NOT_FOUND, STAFF_CANNOT_WRITE_OFF, MODULE_NOT_IN_PLAN |
| GET | `/api/v1/pharmacy/inventory/expiry-alerts` | Bearer | UNAUTHORIZED, MODULE_NOT_IN_PLAN |
| GET | `/api/v1/pharmacy/inventory/expiry-report` | Bearer owner | UNAUTHORIZED, FORBIDDEN, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given batches GET, when loaded, then expiry dates display.
2. **AC-002**: Given add batch, when POST valid, then qty increases on refresh.
3. **AC-003**: Given write-off, when DELETE/adjust as Core, then confirm then success.
4. **AC-004**: Given expiry-alerts, when items, then links to product.
5. **AC-005**: Given expiry-report, when loaded, then table/export if Core provides.
6. **AC-006**: Given VALIDATION_ERROR qty, when adjust, then field error.
7. **AC-007**: Given pharmacist read-only, when write hidden, then no add.
8. **AC-008**: Given a11y, when write-off dialog, then labelled.

## Test requirements

- Unit: Write-off confirm
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Expiry alerts render
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-006 STORY-001-003

**Implemented Core references**

- EPIC-006 STORY-002

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
