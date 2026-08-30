# STORY-P009-003: Rack locations, assign, print labels

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P009-003` |
| Epic | [EPIC-P009](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-inventory` |
| Minimum plan | `FREE+` |

## Overview

Full rack-location CRUD, unlocated products, assign, print-labels.

**Business value:** Staff find a strip on the correct shelf.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/racks`

**Screens / states**

- Racks
- Unlocated
- Label print

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Rack list
- Assign
- Print labels

### Out of scope

- Hardware printer drivers — print uses Core payload / browser print

## Business rules

1. GET unlocated for assignment queue.
2. print-labels POST then print dialog / PDF as Core returns.
3. Delete rack confirms.
4. PATCH product rack also on inventory detail.
5. Codes unique per Core validation.
6. Empty racks empty-state CTA create.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/rack-locations` | Bearer | UNAUTHORIZED, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/rack-locations` | Bearer owner | VALIDATION_ERROR, FORBIDDEN, MODULE_NOT_IN_PLAN |
| GET | `/api/v1/pharmacy/rack-locations/unlocated` | Bearer | UNAUTHORIZED, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/rack-locations/assign` | Bearer | VALIDATION_ERROR, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/rack-locations/print-labels` | Bearer | VALIDATION_ERROR, MODULE_NOT_IN_PLAN |
| GET | `/api/v1/pharmacy/rack-locations/{rackCode}` | Bearer | RACK_NOT_FOUND, MODULE_NOT_IN_PLAN |
| DELETE | `/api/v1/pharmacy/rack-locations/{rackCode}` | Bearer owner | FORBIDDEN, RACK_NOT_FOUND, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given GET racks, when loaded, then codes list.
2. **AC-002**: Given create, when POST, then appears.
3. **AC-003**: Given unlocated, when assign, then POST assign.
4. **AC-004**: Given print-labels, when POST, then user can print.
5. **AC-005**: Given delete, when confirmed, then gone.
6. **AC-006**: Given 404 rack, when GET, then not-found.
7. **AC-007**: Given validation duplicate code, when create, then error.
8. **AC-008**: Given a11y, when assign, then combobox labelled.

## Test requirements

- Unit: Assign unlocated
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Delete rack
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-006 STORY-001-003

**Implemented Core references**

- EPIC-006 STORY-003

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
