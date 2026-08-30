# STORY-P019-002: Ticket reply, CSAT, reopen

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P019-002` |
| Epic | [EPIC-P019](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-support` |
| Minimum plan | `FREE+` |

## Overview

POST reply, csat, reopen. Hide admin-only controls.

**Business value:** Conversation continues on the same id.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/support/tickets/:id`

**Screens / states**

- Reply
- CSAT
- Reopen

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Reply
- CSAT
- Reopen

### Out of scope

- Escalate/assign/resolve primary

## Business rules

1. is_internal_note false/omitted.
2. CSAT and reopen are creator-only because Core compares the ticket customer_id to the caller subject.
3. Reopen reason DTO.
4. Hide escalate by default.
5. Refresh GET after POST.
6. Empty reply validation.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/support/tickets/{id}/reply` | Bearer | VALIDATION_ERROR, FORBIDDEN |
| POST | `/api/v1/support/tickets/{id}/csat` | Bearer ticket creator | VALIDATION_ERROR, FORBIDDEN |
| POST | `/api/v1/support/tickets/{id}/reopen` | Bearer ticket creator | VALIDATION_ERROR, FORBIDDEN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given an open pharmacy ticket, when a valid reply succeeds, then refreshed detail includes the reply.
2. **AC-002**: Given a resolved eligible ticket, when CSAT is submitted, then POST csat is sent once.
3. **AC-003**: Given Core allows reopen, when a valid reason is submitted, then POST reopen runs and detail refreshes.
4. **AC-004**: Given a pharmacy actor, when the composer renders, then internal-note and escalation controls are absent.
5. **AC-005**: Given an empty reply, when submit is attempted, then validation is shown and the thread is unchanged.
6. **AC-006**: Given Core returns FORBIDDEN, when a mutation fails, then a permission error appears without an upgrade CTA.

## Test requirements

- Unit: Reply
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Hide escalate
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
