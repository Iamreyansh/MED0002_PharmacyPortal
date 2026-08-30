# STORY-P016-001: Settlement history list

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P016-001` |
| Epic | [EPIC-P016](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-finance` |
| Minimum plan | `FREE+` |

## Overview

GET /pharmacy/finance/settlements paginated.

**Business value:** Owner sees weekly payouts.

## User roles and access

**Personas**

- `pharmacy_owner`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/finance/settlements`

**Screens / states**

- Settlements

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Table

### Out of scope

- Staff access

## Business rules

1. Owner-only.
2. Amounts as DTO.
3. IST labels from UTC timestamps.
4. Empty state.
5. No invented holds.
6. Pagination.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/finance/settlements` | Bearer owner | FORBIDDEN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given an authenticated pharmacy owner, when the settlement list succeeds, then the returned rows are displayed.
2. **AC-002**: Given pharmacy staff, when they open the owner-only route, then the item is omitted or Core's 403 is shown.
3. **AC-003**: Given Core returns no settlements, when loading completes, then an explanatory empty state is displayed.
4. **AC-004**: Given meta.has_next is true, when Next is activated, then the next page is requested.
5. **AC-005**: Given Core returns an amount, when it renders, then it is formatted as INR without client recalculation.
6. **AC-006**: Given keyboard or screen-reader use, when the table loads, then loading status and column headers are accessible.

## Test requirements

- Unit: Owner only
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: List
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-012 STORY-003

**Implemented Core references**

- EPIC-012 STORY-003

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
