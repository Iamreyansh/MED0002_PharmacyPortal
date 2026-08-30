# STORY-P010-001: Purchase GRN create, items, save-and-stock

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P010-001` |
| Epic | [EPIC-P010](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-procurement` |
| Minimum plan | `FREE+` |

## Overview

GRN list/create/get, item add/patch/delete, save-and-stock (owner).

**Business value:** Incoming invoices become batches.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/purchases`
- `/purchases/:grnId`

**Screens / states**

- GRN list
- GRN editor

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- GRN editor
- Stock-in

### Out of scope

- CSV (next story)

## Business rules

1. States DRAFT/SAVED/STOCKED.
2. save-and-stock owner-only.
3. Cannot edit STOCKED if Core forbids.
4. Money paise/rs per DTO.
5. List pagination.
6. Link to product after stock-in.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/purchases` | Bearer | UNAUTHORIZED, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/purchases` | Bearer | VALIDATION_ERROR, MODULE_NOT_IN_PLAN |
| GET | `/api/v1/pharmacy/purchases/{grnId}` | Bearer | GRN_NOT_FOUND, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/purchases/{grnId}/items` | Bearer | VALIDATION_ERROR, MODULE_NOT_IN_PLAN |
| PATCH | `/api/v1/pharmacy/purchases/{grnId}/items/{itemId}` | Bearer | VALIDATION_ERROR, MODULE_NOT_IN_PLAN |
| DELETE | `/api/v1/pharmacy/purchases/{grnId}/items/{itemId}` | Bearer | FORBIDDEN, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/purchases/{grnId}/save-and-stock` | Bearer owner | FORBIDDEN, VALIDATION_ERROR, STAFF_CANNOT_STOCK, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given list GET, when loaded, then GRNs show status.
2. **AC-002**: Given create, when POST, then editor opens new id.
3. **AC-003**: Given add item, when POST items, then line appears.
4. **AC-004**: Given save-and-stock, when owner, then status STOCKED on refresh.
5. **AC-005**: Given staff, when save-and-stock hidden, then 403 if called.
6. **AC-006**: Given STOCKED, when add item, then Core error shown.
7. **AC-007**: Given 404, when bad id, then not-found.
8. **AC-008**: Given a11y, when editor table, then headers present.

## Test requirements

- Unit: save-and-stock owner
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Item line CRUD
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-006 STORY-004-006

**Implemented Core references**

- EPIC-006 STORY-004

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
