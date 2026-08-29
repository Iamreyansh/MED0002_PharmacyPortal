# STORY-P006-001: Role catalogue create and delete

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P006-001` |
| Epic | [EPIC-P006](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-settings` |
| Minimum plan | `FREE+` |

## Overview

GET/POST/DELETE /pharmacy/roles. System roles cannot be deleted if Core forbids.

**Business value:** Managers define cashier vs pharmacist packs.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated pharmacy owner|staff; create/delete owner-only`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/settings/roles`

**Screens / states**

- Roles list
- Create dialog

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- List
- Create
- Delete

### Out of scope

- Assign role to a person

## Business rules

1. MODULE_NOT_IN_PLAN possible.
2. System roles (owner, manager, pharmacist, cashier, delivery) are read-only if Core marks them.
3. Delete confirms.
4. Create validation from Core.
5. Assigned staff may read roles; owner-only create and delete actions are hidden for staff.
6. Do not show a people roster.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/roles` | Bearer | UNAUTHORIZED, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/roles` | Bearer owner | VALIDATION_ERROR, FORBIDDEN, MODULE_NOT_IN_PLAN |
| DELETE | `/api/v1/pharmacy/roles/{id}` | Bearer owner | FORBIDDEN, ROLE_NOT_FOUND, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given roles GET, when loaded, then system and custom roles render.
2. **AC-002**: Given create, when valid name, then POST succeeds and list refreshes.
3. **AC-003**: Given delete custom, when confirmed, then DELETE called.
4. **AC-004**: Given delete system, when Core forbids, then error shown and row remains.
5. **AC-005**: Given MODULE_NOT_IN_PLAN, when GET, then lock panel.
6. **AC-006**: Given empty custom list, when only system roles, then empty-custom hint, not a blank page.
7. **AC-007**: Given 403, when unauthorized staff, then forbidden.
8. **AC-008**: Given a11y, when delete, then confirm dialog labelled.

## Test requirements

- Unit: System roles not deleted
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Create role
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-001 STORY-005

**Implemented Core references**

- EPIC-001 STORY-005

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
