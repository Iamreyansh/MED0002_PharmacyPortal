# STORY-P015-002: Order accept and reject by id (no inbox)

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P015-002` |
| Epic | [EPIC-P015](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-orders` |
| Minimum plan | `FREE+` |

## Overview

Deep-link screen: POST accept and POST reject. No GET order. UI shows id and mutation payload only.

**Business value:** Staff can accept a notification order without a fake inbox.

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

- Order actions (id-in-hand)

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Action panel

### Out of scope

- GET /pharmacy/orders
- GET /pharmacy/orders/{id}

## Business rules

1. Invalid UUID → client error, no call.
2. Reject confirms; refund is async/eventual.
3. No list polling.
4. 404/409 shown from Core.
5. `/orders` without id is not a list — not found/guidance.
6. Help text: open from notification.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/pharmacy/orders/{id}/accept` | Bearer | ORDER_NOT_FOUND, ORDER_ALREADY_ACTIONED, INVALID_STATUS_TRANSITION |
| POST | `/api/v1/pharmacy/orders/{id}/reject` | Bearer | VALIDATION_ERROR, ORDER_NOT_FOUND, ORDER_ALREADY_ACTIONED, INVALID_STATUS_TRANSITION |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given UUID in route, when accept succeeds, then success panel from response.
2. **AC-002**: Given reject confirm, when POST, then eventual refund copy shown.
3. **AC-003**: Given 404, when unknown id, then not-found without invented order fields.
4. **AC-004**: Given `/orders` without id, when routed, then not a list.
5. **AC-005**: Given PENDING_KYC, when blocked by guard.
6. **AC-006**: Given already accepted, when accept, then conflict message.
7. **AC-007**: Given a11y, when reject confirm, then labelled.
8. **AC-008**: Given network log, when page loads, then no GET /pharmacy/orders.

## Test requirements

- Unit: No list fetch
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Accept/reject
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

- No additional implementation notes.
