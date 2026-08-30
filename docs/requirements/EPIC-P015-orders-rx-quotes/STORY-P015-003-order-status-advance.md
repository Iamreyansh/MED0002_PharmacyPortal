# STORY-P015-003: Advance order packing status by id

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P015-003` |
| Epic | [EPIC-P015](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-orders` |
| Minimum plan | `FREE+` |

## Overview

PATCH status for allowed transitions. Without GET, choices are explicit and 409 is expected.

**Business value:** Marketplace SLA can progress for a known id.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/orders/:orderId`

**Screens / states**

- Status actions

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Status buttons

### Out of scope

- Kanban of all orders

## Business rules

1. Only send statuses Core accepts.
2. Do not offer DELIVERED unless pharmacy enum includes it.
3. Label session-cached status as not live.
4. A POS token is rejected with POS_TOKEN_RESTRICTED.
5. 409 illegal transition shown.
6. No GET order.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| PATCH | `/api/v1/pharmacy/orders/{id}/status` | Bearer | VALIDATION_ERROR, ORDER_NOT_FOUND, INVALID_STATUS_TRANSITION, POS_TOKEN_RESTRICTED |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given after accept, when user advances packing, then PATCH status.
2. **AC-002**: Given illegal transition, when 409, then message.
3. **AC-003**: Given refresh without GET, when user picks a status, then 409 is acceptable recovery.
4. **AC-004**: Given DELIVERED, when UI, then not offered unless Core allows pharmacy to set it.
5. **AC-005**: Given 404, when shown.
6. **AC-006**: Given a POS token, when the status endpoint is attempted, then POS_TOKEN_RESTRICTED is shown.
7. **AC-007**: Given a11y, when status buttons, then named.
8. **AC-008**: Given cached status, when shown, then labelled local cache.

## Test requirements

- Unit: 409 transition
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: PATCH status
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-010 STORY-003
- PharmacyOrderLifecycleController

**Implemented Core references**

- OrderStateMachine

**Shared portal requirements**

- `PRODUCT-IDEOLOGY.md`
- `PERSONAS-RBAC-PLAN-MATRIX.md`
- `API-INTEGRATION-CONTRACT.md`
- `DOMAIN-STATE-MACHINES.md`
- `ERROR-AND-RECOVERY-CATALOG.md`
- `UX-ACCESSIBILITY-STANDARDS.md`
- `NON-FUNCTIONAL-REQUIREMENTS.md`

## Notes

- Explicit packing status buttons; 409 illegal transitions shown; DELIVERED not offered; cached status labelled not live.
