# STORY-P010-002: GRN CSV import and confirm

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P010-002` |
| Epic | [EPIC-P010](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-procurement` |
| Minimum plan | `FREE+` |

## Overview

POST import-csv multipart then confirm-import.

**Business value:** Bulk distributor invoices without retyping.

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

**Screens / states**

- CSV import wizard

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- File picker
- Preview/confirm as Core returns

### Out of scope

- Invented CSV template columns — document Core’s

## Business rules

1. Multipart only.
2. Show Core parse errors per row if returned.
3. confirm-import required before stock.
4. Max file size Core/product 10MB.
5. Owner vs staff: follow Core 403.
6. Do not send CSV to a random S3.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/pharmacy/purchases/import-csv` | Bearer multipart | VALIDATION_ERROR, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/purchases/{grnId}/confirm-import` | Bearer | VALIDATION_ERROR, GRN_NOT_FOUND, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given CSV, when import-csv succeeds, then a grnId is shown.
2. **AC-002**: Given row errors, when returned, then listed.
3. **AC-003**: Given confirm-import, when clicked, then GRN proceeds.
4. **AC-004**: Given invalid file type, when upload, then VALIDATION_ERROR.
5. **AC-005**: Given 10MB+, when Core rejects, then message.
6. **AC-006**: Given keyboard, when file input, then labelled.
7. **AC-007**: Given failure mid-way, when confirm fails, then GRN still get-able.
8. **AC-008**: Given staff 403, when import, then forbidden.

## Test requirements

- Unit: Import then confirm
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Bad CSV
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
