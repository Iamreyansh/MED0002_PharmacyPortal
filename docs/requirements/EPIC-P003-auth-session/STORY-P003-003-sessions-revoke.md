# STORY-P003-003: Active sessions list and revoke

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P003-003` |
| Epic | [EPIC-P003](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0002` |
| Screen owner | `mfe-auth` |
| Minimum plan | `FREE+` |

## Overview

Paginated GET /auth/sessions and DELETE /auth/sessions/{id}.

**Business value:** Owners can kick a forgotten counter tablet.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/sessions`

**Screens / states**

- Sessions table

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- List
- Revoke one

### Out of scope

- Admin viewing other staff sessions

## Business rules

1. Pagination page/limit per INDEX.
2. Current session marked if Core provides a flag; otherwise show all equally.
3. Revoke confirms.
4. Revoking current session equals logout.
5. Staff see only their sessions.
6. IP and user-agent displayed if Core returns them; do not invent geolocation.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/auth/sessions` | Bearer | UNAUTHORIZED |
| DELETE | `/api/v1/auth/sessions/{sessionId}` | Bearer | UNAUTHORIZED, SESSION_NOT_FOUND |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given sessions, when `/sessions` loads, then rows come from GET /auth/sessions.
2. **AC-002**: Given empty, when none, then empty state explains.
3. **AC-003**: Given revoke, when confirmed, then DELETE is called and the row disappears or list refreshes.
4. **AC-004**: Given pagination meta.has_next false, when next is clicked, then it is disabled.
5. **AC-005**: Given 401, when listing, then login redirect.
6. **AC-006**: Given keyboard, when confirm dialog, then Escape cancels.
7. **AC-007**: Given current session revoke, when success, then user is on login.
8. **AC-008**: Given error, when DELETE fails, then toast uses error.code.

## Test requirements

- Unit: Sessions table
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Revoke confirm
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- EPIC-P002
- Core EPIC-001 STORY-002/004

**Implemented Core references**

- EPIC-001 STORY-004

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
