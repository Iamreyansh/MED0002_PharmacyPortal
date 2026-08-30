# STORY-P017-002: Sales register and products analytics

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P017-002` |
| Epic | [EPIC-P017](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-analytics` |
| Minimum plan | `RETAIL_PRO+` |

## Overview

GET sales-register and products.

**Business value:** What moved, what did not.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/analytics`

**Screens / states**

- Sales register tab
- Products tab

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Two sections

### Out of scope

- Mixing silently with /pharmacy/sales

## Business rules

1. Same plan gate.
2. Pagination/sort if meta present.
3. Export only if these paths support it.
4. Label vs POS ledger.
5. IST dates.
6. Empty states.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/analytics/sales-register` | Bearer | PLAN_UPGRADE_REQUIRED |
| GET | `/api/v1/pharmacy/analytics/products` | Bearer | PLAN_UPGRADE_REQUIRED |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given a Growth pharmacy, when sales-register succeeds, then the returned analytics rows are displayed.
2. **AC-002**: Given a Growth pharmacy, when products succeeds, then the returned product performance rows are displayed.
3. **AC-003**: Given a Free or Starter pharmacy, when Core returns PLAN_UPGRADE_REQUIRED, then the Growth lock is shown.
4. **AC-004**: Given supported filters, when they are applied, then the request query matches the Core DTO.
5. **AC-005**: Given Core returns no products, when the Products tab loads, then an explanatory empty state is displayed.
6. **AC-006**: Given assistive technology or a recoverable error, when the table renders or Retry is activated, then labels are accessible and only the failed GET repeats.

## Test requirements

- Unit: Two GETs
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Lock
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-016 STORY-004

**Implemented Core references**

- EPIC-016 STORY-004

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
