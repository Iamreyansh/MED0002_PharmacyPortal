# STORY-P010-003: Distributor directory and price compare (Growth+)

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P010-003` |
| Epic | [EPIC-P010](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-procurement` |
| Minimum plan | `RETAIL_PRO+` |

## Overview

Distributor CRUD, supply-list, preferred, price-compare. Locked on Free/Starter.

**Business value:** Owners pick cheaper suppliers.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/distributors`

**Screens / states**

- Distributors
- Price compare
- Lock

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Directory
- Supply list
- Price compare

### Out of scope

- Automatic PO from compare without reorder APIs

## Business rules

1. PLAN_FEATURE_LOCKED on all these endpoints for Free/Starter.
2. Delete confirms.
3. price-compare GET query as Core.
4. set-preferred PATCH.
5. Growth display label on lock.
6. List and supply-list reads permit staff; price compare and all mutations are owner-only.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/distributors` | Bearer | PLAN_FEATURE_LOCKED, MODULE_NOT_IN_PLAN |
| GET | `/api/v1/pharmacy/distributors/price-compare` | Bearer owner | PLAN_FEATURE_LOCKED, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/distributors` | Bearer owner | PLAN_FEATURE_LOCKED, VALIDATION_ERROR, FORBIDDEN, MODULE_NOT_IN_PLAN |
| PATCH | `/api/v1/pharmacy/distributors/{id}` | Bearer owner | PLAN_FEATURE_LOCKED, VALIDATION_ERROR, DISTRIBUTOR_NOT_FOUND, MODULE_NOT_IN_PLAN |
| DELETE | `/api/v1/pharmacy/distributors/{id}` | Bearer owner | PLAN_FEATURE_LOCKED, DISTRIBUTOR_NOT_FOUND, MODULE_NOT_IN_PLAN |
| GET | `/api/v1/pharmacy/distributors/{id}/supply-list` | Bearer | PLAN_FEATURE_LOCKED, MODULE_NOT_IN_PLAN |
| PATCH | `/api/v1/pharmacy/distributors/{id}/supply-list/{productId}/set-preferred` | Bearer owner | PLAN_FEATURE_LOCKED, SUPPLY_ITEM_NOT_FOUND, FORBIDDEN, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given FREE, when opening /distributors, then plan-lock.
2. **AC-002**: Given RETAIL_PRO, when GET list, then rows render.
3. **AC-003**: Given create, when POST valid, then appears.
4. **AC-004**: Given price-compare, when GET, then comparison table.
5. **AC-005**: Given set-preferred, when PATCH, then preferred marked.
6. **AC-006**: Given delete, when confirmed, then gone.
7. **AC-007**: Given PLAN_FEATURE_LOCKED from API, when unexpected, then lock anyway.
8. **AC-008**: Given a11y, when compare table, then headers.

## Test requirements

- Unit: Lock on free
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: CRUD on growth
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-006 STORY-004-006

**Implemented Core references**

- EPIC-006 STORY-005

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
