# STORY-P008-002: Catalogue mapping list and CRUD

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P008-002` |
| Epic | [EPIC-P008](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-catalogue` |
| Minimum plan | `FREE+` |

## Overview

GET/POST/PATCH/DELETE /pharmacy/catalogue-mapping. Owner for POST/DELETE per Core; staff may patch if allowed — follow HTTP.

**Business value:** Online/POS SKUs bind to master medicines.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/catalogue/mapping`

**Screens / states**

- Mapping table
- Edit drawer

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Mapping table
- Create/edit/delete

### Out of scope

- Editing national MRP master

## Business rules

1. PRICE_ABOVE_MRP on patch/create.
2. SCHEDULE_X_NOT_AVAILABLE_ONLINE when enabling online for X.
3. Delete confirms.
4. Do not confuse mapping.stock_quantity with inventory batches — show a note linking /inventory.
5. Pagination.
6. Owner-only operations hidden for staff.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/catalogue-mapping` | Bearer | UNAUTHORIZED |
| POST | `/api/v1/pharmacy/catalogue-mapping` | Bearer owner | VALIDATION_ERROR, PRICE_ABOVE_MRP, FORBIDDEN |
| PATCH | `/api/v1/pharmacy/catalogue-mapping/{mappingId}` | Bearer | VALIDATION_ERROR, PRICE_ABOVE_MRP, SCHEDULE_X_NOT_AVAILABLE_ONLINE |
| DELETE | `/api/v1/pharmacy/catalogue-mapping/{mappingId}` | Bearer owner | FORBIDDEN, MAPPING_NOT_FOUND |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given GET list, when loaded, then rows paginate with meta.
2. **AC-002**: Given owner POST, when price > MRP, then PRICE_ABOVE_MRP.
3. **AC-003**: Given PATCH online on Schedule X, when Core rejects, then SCHEDULE_X_NOT_AVAILABLE_ONLINE.
4. **AC-004**: Given DELETE, when confirmed, then row gone.
5. **AC-005**: Given staff, when POST hidden, then they cannot create.
6. **AC-006**: Given stock note, when mapping quantity differs from inventory, then help text points to inventory.
7. **AC-007**: Given empty, when no mappings, then CTA to search.
8. **AC-008**: Given a11y, when drawer, then focus trap.

## Test requirements

- Unit: MRP error
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Delete confirm
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-005 STORY-003/005

**Implemented Core references**

- EPIC-005 STORY-005

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
