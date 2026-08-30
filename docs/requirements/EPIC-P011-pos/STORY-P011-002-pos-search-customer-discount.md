# STORY-P011-002: POS search, attach customer, apply discount

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P011-002` |
| Epic | [EPIC-P011](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-pos` |
| Minimum plan | `FREE+` |

## Overview

POST cart search, customer attach, discount. Autofocus search.

**Business value:** Fast SKU find and optional walk-in identity.

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

- Search palette
- Customer
- Discount

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Search
- Customer
- Discount

### Out of scope

- Full customer CRM directory

## Business rules

1. Search is POST /pos/cart/{cartId}/search — not catalogue search.
2. Customer body matches Core DTO only.
3. Manual discount has no service-tier check; do not show a plan lock for this action.
4. Autofocus search on mount.
5. No loyalty points invention.
6. Khata is a checkout/khata concern.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/pharmacy/pos/cart/{cartId}/search` | Bearer pos\|full | VALIDATION_ERROR, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/pos/cart/{cartId}/customer` | Bearer pos\|full | VALIDATION_ERROR, CUSTOMER_NOT_FOUND, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/pos/cart/{cartId}/discount` | Bearer pos\|full | VALIDATION_ERROR, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given search query, when POST search, then results are addable to cart.
2. **AC-002**: Given POS mount, when rendered, then search is focused.
3. **AC-003**: Given attach customer, when valid DTO, then cart shows customer.
4. **AC-004**: Given discount, when valid, then totals change per payload.
5. **AC-005**: Given a permitted actor enters a valid manual discount, when Core accepts it, then the cart refreshes without a plan-lock state.
6. **AC-006**: Given empty search, when no hits, then empty state.
7. **AC-007**: Given a single hit, when returned, then it can be added.
8. **AC-008**: Given a11y, when results, then listbox or equivalent.

## Test requirements

- Unit: Search autofocus
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Attach customer
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
