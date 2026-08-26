# STORY-P007-002: Subscribe, upgrade, downgrade, cancel, auto-renew

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P007-002` |
| Epic | [EPIC-P007](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-subscription` |
| Minimum plan | `FREE+` |

## Overview

POST subscribe/upgrade/downgrade/cancel and PATCH auto-renew. Downgrade copy: next renewal. Idempotency on subscribe/upgrade.

**Business value:** Plan changes without a ticket.

## User roles and access

**Personas**

- `pharmacy_owner`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/subscription`

**Screens / states**

- Upgrade confirm
- Downgrade confirm
- Cancel confirm

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Change plan flows
- Cancel confirm
- Auto-renew switch

### Out of scope

- Proration math client-side — display Core invoice later

## Business rules

1. Downgrade is scheduled, not immediate, per Core BR.
2. Cancel confirm names loss of Growth modules.
3. Idempotency-Key on subscribe/upgrade.
4. PAST_DUE banner with pay CTA to /billing.
5. TRIAL badge if status TRIAL.
6. Staff 403.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/pharmacy/subscription/subscribe` | Bearer owner | VALIDATION_ERROR, FORBIDDEN |
| POST | `/api/v1/pharmacy/subscription/upgrade` | Bearer owner | VALIDATION_ERROR, FORBIDDEN |
| POST | `/api/v1/pharmacy/subscription/downgrade` | Bearer owner | VALIDATION_ERROR, FORBIDDEN |
| POST | `/api/v1/pharmacy/subscription/cancel` | Bearer owner | FORBIDDEN |
| PATCH | `/api/v1/pharmacy/subscription/auto-renew` | Bearer owner | FORBIDDEN, VALIDATION_ERROR |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given FREE owner, when subscribe STARTER, then POST subscribe with plan id from catalogue.
2. **AC-002**: Given STARTER, when upgrade RETAIL_PRO, then POST upgrade.
3. **AC-003**: Given downgrade, when confirmed, then copy says next renewal.
4. **AC-004**: Given cancel, when confirmed, then POST cancel.
5. **AC-005**: Given auto-renew toggle, when PATCH, then state matches response.
6. **AC-006**: Given PAST_DUE, when viewing, then billing CTA shown.
7. **AC-007**: Given double click subscribe, when idempotency, then one intent.
8. **AC-008**: Given error, when Core rejects, then error.code shown.

## Test requirements

- Unit: Downgrade copy
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Subscribe idempotency header
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-014
- Cashfree pg checkout fields from pay response

**Implemented Core references**

- EPIC-014 STORY-002

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
