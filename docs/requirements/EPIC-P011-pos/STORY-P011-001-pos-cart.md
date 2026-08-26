# STORY-P011-001: POS cart create, get, items, clear

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P011-001` |
| Epic | [EPIC-P011](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-pos` |
| Minimum plan | `FREE+` |

## Overview

POST cart, GET cart, add/update/remove items, clear cart.

**Business value:** A bill can be built line by line.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/pos`

**Screens / states**

- POS cart

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Cart panel

### Out of scope

- Checkout

## Business rules

1. POS token allowed.
2. INSUFFICIENT_STOCK on add/update.
3. Clear confirms if lines exist.
4. Keep cartId in host memory, not a public share URL.
5. Qty 0 follows Core (remove vs error).
6. Search is a separate POS endpoint.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/pharmacy/pos/cart` | Bearer pos\|full | UNAUTHORIZED, MODULE_NOT_IN_PLAN |
| GET | `/api/v1/pharmacy/pos/cart/{cartId}` | Bearer pos\|full | CART_NOT_FOUND, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/pos/cart/{cartId}/items` | Bearer pos\|full | INSUFFICIENT_STOCK, VALIDATION_ERROR, MODULE_NOT_IN_PLAN |
| PATCH | `/api/v1/pharmacy/pos/cart/{cartId}/items/{itemId}` | Bearer pos\|full | INSUFFICIENT_STOCK, VALIDATION_ERROR, MODULE_NOT_IN_PLAN |
| DELETE | `/api/v1/pharmacy/pos/cart/{cartId}/items/{itemId}` | Bearer pos\|full | VALIDATION_ERROR, MODULE_NOT_IN_PLAN |
| DELETE | `/api/v1/pharmacy/pos/cart/{cartId}` | Bearer pos\|full | CART_NOT_FOUND, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given POS entry, when POST cart, then empty cart shows.
2. **AC-002**: Given add item, when POST items, then line and totals from payload.
3. **AC-003**: Given INSUFFICIENT_STOCK, when add, then qty rejected.
4. **AC-004**: Given PATCH qty, when valid, then totals update.
5. **AC-005**: Given DELETE item, when clicked, then line gone.
6. **AC-006**: Given clear, when confirmed, then DELETE cart and a new cart is created.
7. **AC-007**: Given 404 cart, when stale, then recreate cart.
8. **AC-008**: Given keyboard, when qty, then labelled input.

## Test requirements

- Unit: Add item stock error
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Clear confirm
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-007 STORY-001
- EPIC-P003-005

**Implemented Core references**

- EPIC-007 STORY-001

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
