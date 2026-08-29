# STORY-P008-001: Pharmacy catalogue search

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P008-001` |
| Epic | [EPIC-P008](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-catalogue` |
| Minimum plan | `FREE+` |

## Overview

GET /pharmacy/catalogue/search with query params Core defines.

**Business value:** Staff add the right SKU, not a lookalike.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/catalogue`

**Screens / states**

- Search results

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Search box
- Result list

### Out of scope

- Customer app search

## Business rules

1. Debounce search; min chars per Core if any.
2. Show schedule flags from payload.
3. Pagination if present.
4. Empty query empty-state, not all-India dump if Core forbids.
5. Selecting a result can deep-link mapping create.
6. POS search is a different endpoint (P011) — do not reuse accidentally without checking path.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/catalogue/search` | Bearer | VALIDATION_ERROR |
| GET | `/api/v1/admin/catalogue/schedule-rules` | Bearer pharmacy owner\|staff | UNAUTHORIZED |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given query paracetamol, when GET search, then results render names from data.
2. **AC-002**: Given empty, when no hits, then empty state.
3. **AC-003**: Given schedule H, when flag present, then visible non-colour-only.
4. **AC-004**: Given 400, when short query, then validation.
5. **AC-005**: Given keyboard, when results, then they are a listbox or links.
6. **AC-006**: Given debounce, when typing, then not one request per key without delay.
7. **AC-007**: Given error, when 500, then retry.
8. **AC-008**: Given mapped vs unmapped, when payload includes it, then shown.

## Test requirements

- Unit: Search debounce
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Results render
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-005 STORY-003/005

**Implemented Core references**

- EPIC-005 STORY-003

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
