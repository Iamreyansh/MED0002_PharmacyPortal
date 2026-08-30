# STORY-P009-001: Inventory list, summary, detail, and product patch

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P009-001` |
| Epic | [EPIC-P009](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-inventory` |
| Minimum plan | `FREE+` |

## Overview

GET list/summary/detail, PATCH product, PATCH details, Excel export if list supports format= as Core/Bruno.

**Business value:** Stock master is the ERP source of truth.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/inventory`
- `/inventory/:productId`

**Screens / states**

- Inventory table
- Product detail

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Filters
- Summary cards
- Detail
- Export

### Out of scope

- Creating products without Core POST — if only PATCH exists, create via GRN/mapping

## Business rules

1. pharmacy_id from JWT only.
2. Online visibility toggle is STORY-P009-004.
3. Export uses Core query (e.g. Excel) — follow Bruno list.
4. Empty inventory CTA to catalogue/purchases.
5. Pagination.
6. Staff may PATCH rack_location_code; online visibility, loose selling, and reorder level are owner-only, and the details PATCH is owner-only.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/inventory` | Bearer | UNAUTHORIZED, MODULE_NOT_IN_PLAN |
| GET | `/api/v1/pharmacy/inventory/summary` | Bearer | UNAUTHORIZED, MODULE_NOT_IN_PLAN |
| GET | `/api/v1/pharmacy/inventory/{productId}` | Bearer | PRODUCT_NOT_FOUND, MODULE_NOT_IN_PLAN |
| PATCH | `/api/v1/pharmacy/inventory/{productId}` | Bearer owner\|staff; owner-only protected fields | VALIDATION_ERROR, PLAN_FEATURE_LOCKED, FORBIDDEN, PRODUCT_NOT_FOUND, MODULE_NOT_IN_PLAN |
| PATCH | `/api/v1/pharmacy/inventory/{productId}/details` | Bearer owner | VALIDATION_ERROR, PRODUCT_NOT_FOUND, FORBIDDEN, MODULE_NOT_IN_PLAN |
| PATCH | `/api/v1/pharmacy/inventory/{productId}/rack` | Bearer | VALIDATION_ERROR, PRODUCT_NOT_FOUND, RACK_NOT_FOUND, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given GET list, when loaded, then products paginate.
2. **AC-002**: Given summary, when cards, then they match summary payload.
3. **AC-003**: Given detail, when id valid, then GET product renders batches link.
4. **AC-004**: Given PATCH details, when valid, then saved.
5. **AC-005**: Given unknown id, when 404, then not-found.
6. **AC-006**: Given export, when Core supports it, then file download starts.
7. **AC-007**: Given empty, when no products, then CTA purchases/catalogue.
8. **AC-008**: Given cashier without write, when PATCH hidden, then read-only.

## Test requirements

- Unit: List pagination
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Detail 404
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-006 STORY-001-003

**Implemented Core references**

- EPIC-006 STORY-001

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
