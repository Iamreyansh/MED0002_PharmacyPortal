# STORY-P007-003: SaaS invoices and Cashfree pay handoff

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P007-003` |
| Epic | [EPIC-P007](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-subscription` |
| Minimum plan | `FREE+` |

## Overview

List/get SaaS invoices and POST /pharmacy/billing/pay. Start Cashfree using public fields Core returns. Return to /billing and GET invoice/subscription (eventual).

**Business value:** Owners can pay the ERP bill.

## User roles and access

**Personas**

- `pharmacy_owner`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/billing`

**Screens / states**

- Invoice list
- Invoice detail
- Cashfree handoff

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Invoice table
- Pay button
- Return URL handling

### Out of scope

- Webhook handling
- Secret key
- Customer marketplace payments

## Business rules

1. Pay is owner-only with Idempotency-Key.
2. Never embed CASHFREE_SECRET_KEY.
3. After return, poll GET invoice; do not mark paid locally.
4. Amounts: follow DTO (rs vs paise).
5. Empty invoices empty-state.
6. Fail-closed subscribe in prod (Core) → show error honestly.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/billing/invoices` | Bearer owner | FORBIDDEN |
| GET | `/api/v1/pharmacy/billing/invoices/{id}` | Bearer owner | FORBIDDEN, INVOICE_NOT_FOUND |
| POST | `/api/v1/pharmacy/billing/pay` | Bearer owner | VALIDATION_ERROR, FORBIDDEN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given invoices, when list loads, then rows from GET billing/invoices.
2. **AC-002**: Given unpaid, when Pay, then POST pay with idempotency key.
3. **AC-003**: Given pay response session fields, when present, then Cashfree checkout starts with public fields only.
4. **AC-004**: Given return URL, when landing `/billing?invoice_id=`, then GET that invoice.
5. **AC-005**: Given still unpaid, when webhook delayed, then UI says processing not success.
6. **AC-006**: Given 403 staff, when visiting, then forbidden.
7. **AC-007**: Given pay error, when fail-closed, then message shown, no fake paid.
8. **AC-008**: Given a11y, when Pay, then button disabled in-flight.

## Test requirements

- Unit: Pay does not store secrets
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Return URL refetch
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-014
- Cashfree pg checkout fields from pay response

**Implemented Core references**

- EPIC-014 STORY-003

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
