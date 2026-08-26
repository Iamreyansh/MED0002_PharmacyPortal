# STORY-P006-002: Role permission editor

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P006-002` |
| Epic | [EPIC-P006](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-settings` |
| Minimum plan | `FREE+` |

## Overview

GET/PUT /pharmacy/roles/{id}/permissions with resource:action catalogue Core returns.

**Business value:** Least-privilege at the counter.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/settings/roles`

**Screens / states**

- Permission matrix

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Permission matrix

### Out of scope

- Inventing permissions not in Core

## Business rules

1. PUT replaces the set as Core specifies.
2. Owner role may be immutable.
3. UI groups by resource (orders, inventory, staff, reports, prescriptions, payments).
4. Saving owner-only permission strings still subject to HTTP owner matchers on those APIs.
5. Conflict if role deleted mid-edit.
6. Unsaved changes confirm.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/roles/{id}/permissions` | Bearer | ROLE_NOT_FOUND, MODULE_NOT_IN_PLAN |
| PUT | `/api/v1/pharmacy/roles/{id}/permissions` | Bearer owner\|staff with staff:manage | VALIDATION_ERROR, FORBIDDEN, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given a custom role, when opened, then GET permissions checks match payload.
2. **AC-002**: Given PUT, when toggles saved, then success and GET refresh.
3. **AC-003**: Given owner role immutable, when Core forbids PUT, then editor read-only.
4. **AC-004**: Given unknown permission omitted from GET, when UI, then it is not shown.
5. **AC-005**: Given VALIDATION_ERROR, when empty set disallowed, then shown.
6. **AC-006**: Given dirty matrix, when navigating away, then confirm.
7. **AC-007**: Given keyboard, when checkboxes, then they are togglable.
8. **AC-008**: Given 404, when stale id, then error.

## Test requirements

- Unit: PUT permissions body
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Immutable owner
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
