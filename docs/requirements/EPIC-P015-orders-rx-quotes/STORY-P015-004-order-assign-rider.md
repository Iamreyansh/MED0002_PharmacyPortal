# STORY-P015-004: Assign rider by order id

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P015-004` |
| Epic | [EPIC-P015](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-orders` |
| Minimum plan | `FREE+` |

## Overview

POST assign-rider. No pharmacy rider directory API — UUID field only, do not invent GET /riders.

**Business value:** Dispatch when a rider id is known.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated pharmacy_owner or pharmacy_staff; Core tenant/role check only`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/orders/:orderId`

**Screens / states**

- Assign rider

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Assign form

### Out of scope

- Rider map
- Listing riders

## Business rules

1. No GET /pharmacy/riders.
2. Manual UUID (or fields Core DTO requires) only.
3. Core applies pharmacy owner/staff role and tenant checks; no orders:dispatch permission is claimed.
4. A POS token is rejected with POS_TOKEN_RESTRICTED.
5. Success from response only.
6. If Core later adds a picker API, replace this story — do not guess now.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/pharmacy/orders/{id}/assign-rider` | Bearer | VALIDATION_ERROR, FORBIDDEN, ORDER_NOT_FOUND, POS_TOKEN_RESTRICTED |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given valid DTO, when POST succeeds, then success panel.
2. **AC-002**: Given invalid UUID, when client, then no POST.
3. **AC-003**: Given 404, when Core, then message.
4. **AC-004**: Given network log, when page, then no rider list GET.
5. **AC-005**: Given an authenticated owner or staff actor for the order's pharmacy, when the route is valid, then the assignment form is shown.
6. **AC-006**: Given any other platform role, when the route is attempted, then Core rejects access.
7. **AC-007**: Given a11y, when rider_id, then labelled.
8. **AC-008**: Given a POS token, when assignment is attempted, then POS_TOKEN_RESTRICTED is shown.

## Test requirements

- Unit: No rider list GET
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Assign POST
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-010 STORY-003
- PharmacyOrderLifecycleController

**Implemented Core references**

- EPIC-010 pharmacy assign-rider

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
