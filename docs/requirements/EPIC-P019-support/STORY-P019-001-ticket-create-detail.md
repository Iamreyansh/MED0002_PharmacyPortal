# STORY-P019-001: Create support ticket and view by id

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P019-001` |
| Epic | [EPIC-P019](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-support` |
| Minimum plan | `FREE+` |

## Overview

POST /support/tickets then GET /support/tickets/{id}. Persist id. No list.

**Business value:** Shop can reach CX.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/support/new`
- `/support/tickets/:id`

**Screens / states**

- New ticket
- Ticket detail

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Create form
- Detail

### Out of scope

- GET list
- Assign/resolve/escalate/priority primary buttons

## Business rules

1. Category as Core enum (PHARMACY if required).
2. After create, route to id.
3. Display GET as-is (internal notes stripped by Core).
4. Hide admin mutations that 403.
5. No inbox shortcut that lists tickets.
6. Attachments per DTO.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/support/tickets` | Bearer | VALIDATION_ERROR |
| GET | `/api/v1/support/tickets/{id}` | Bearer | FORBIDDEN, TICKET_NOT_FOUND |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given a valid ticket form, when Core returns 201, then the portal navigates to the returned ticket id.
2. **AC-002**: Given an accessible ticket id, when detail succeeds, then subject, description, and replies render from Core.
3. **AC-003**: Given either support page, when requests are inspected, then GET /support/tickets without an id is never called.
4. **AC-004**: Given an out-of-scope ticket id, when Core returns 404 or FORBIDDEN, then no ticket data is leaked.
5. **AC-005**: Given a missing subject, when submit is attempted, then validation is shown and no success navigation occurs.
6. **AC-006**: Given a pharmacy actor, when ticket actions render, then admin controls are absent and form labels are accessible.

## Test requirements

- Unit: Create then GET
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: No list
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-015 STORY-001/002

**Implemented Core references**

- EPIC-015 STORY-001

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
