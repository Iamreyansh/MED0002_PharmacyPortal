# STORY-P010-004: Reorder suggestions and purchase orders (Growth+)

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P010-004` |
| Epic | [EPIC-P010](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-procurement` |
| Minimum plan | `RETAIL_PRO+` |

## Overview

Reorder list, refresh, create-po, PO list, patch, send, record-grn.

**Business value:** Avoid stockouts without spreadsheet math.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/reorder`

**Screens / states**

- Reorder
- PO
- Lock

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Suggestions
- PO editor
- Send
- Record GRN

### Out of scope

- Emailing distributors from the browser

## Business rules

1. PLAN_FEATURE_LOCKED Free/Starter.
2. PO states DRAFT/SENT/RECEIVED/CANCELLED.
3. record-grn links to purchases flow.
4. refresh POST recalculates suggestions.
5. send confirms.
6. Do not compute suggestions client-side.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/reorder` | Bearer | PLAN_FEATURE_LOCKED, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/reorder/refresh` | Bearer owner | PLAN_FEATURE_LOCKED, FORBIDDEN, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/reorder/create-po` | Bearer | PLAN_FEATURE_LOCKED, VALIDATION_ERROR, MODULE_NOT_IN_PLAN |
| GET | `/api/v1/pharmacy/reorder/purchase-orders` | Bearer | PLAN_FEATURE_LOCKED, MODULE_NOT_IN_PLAN |
| PATCH | `/api/v1/pharmacy/reorder/purchase-orders/{poId}` | Bearer | PLAN_FEATURE_LOCKED, VALIDATION_ERROR, PO_NOT_FOUND, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/reorder/purchase-orders/{poId}/send` | Bearer owner | PLAN_FEATURE_LOCKED, PO_NOT_FOUND, FORBIDDEN, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/reorder/purchase-orders/{poId}/record-grn` | Bearer | PLAN_FEATURE_LOCKED, PO_NOT_FOUND, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given FREE, when /reorder, then lock.
2. **AC-002**: Given Growth, when GET reorder, then suggestions list.
3. **AC-003**: Given refresh, when POST, then list updates.
4. **AC-004**: Given create-po, when POST, then PO editor.
5. **AC-005**: Given send, when confirmed, then status SENT.
6. **AC-006**: Given record-grn, when POST, then user can open GRN.
7. **AC-007**: Given DRAFT patch, when PATCH, then lines update.
8. **AC-008**: Given a11y, when send dialog, then labelled.

## Test requirements

- Unit: Lock reorder
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Send PO
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-006 STORY-004-006

**Implemented Core references**

- EPIC-006 STORY-006

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
