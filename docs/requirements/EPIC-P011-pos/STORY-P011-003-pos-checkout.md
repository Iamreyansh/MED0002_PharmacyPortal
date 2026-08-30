# STORY-P011-003: POS checkout with FEFO and payments

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P011-003` |
| Epic | [EPIC-P011](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-pos` |
| Minimum plan | `FREE+` |

## Overview

POST checkout with payment methods Core supports. Idempotency-Key. Receipt from response.

**Business value:** Money taken matches GST invoice and stock.

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

- Pay panel
- Receipt

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Pay panel
- Success receipt

### Out of scope

- Cashfree customer PG
- Offline sales

## Business rules

1. Idempotency-Key required.
2. INSUFFICIENT_STOCK is failure, never a receipt.
3. Checkout has no Khata-specific plan check; render only payment methods accepted by the request DTO.
4. Success uses response only.
5. data-testid=pos-checkout.
6. Telemetry pos_checkout_result without line items.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/pharmacy/pos/cart/{cartId}/checkout` | Bearer pos\|full | INSUFFICIENT_STOCK, VALIDATION_ERROR, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given payable cart, when checkout succeeds, then receipt uses data.
2. **AC-002**: Given double click, when same idempotency key, then one intent.
3. **AC-003**: Given INSUFFICIENT_STOCK, when checkout, then no receipt.
4. **AC-004**: Given an implemented payment method, when checkout succeeds, then the receipt renders from Core without a plan-lock state.
5. **AC-005**: Given invoice id in response, when success, then link `/invoices/:id` for full-token users.
6. **AC-006**: Given in-flight, when pay, then disabled.
7. **AC-007**: Given 500, when Retry, then same idempotency key.
8. **AC-008**: Given a11y, when pay methods, then labelled.

## Test requirements

- Unit: Checkout idempotency
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Stock failure
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
