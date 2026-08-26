# STORY-P012-003: Sales ledger, summary, export

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P012-003` |
| Epic | [EPIC-P012](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-billing` |
| Minimum plan | `FREE+` |

## Overview

GET /pharmacy/sales, /summary, /{saleId}. Excel via Bruno sales/export-excel.

**Business value:** Day close without a second spreadsheet.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/sales`

**Screens / states**

- Sales ledger
- Sale detail

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Filters
- Summary
- Export

### Out of scope

- P&L analytics (P017)

## Business rules

1. Date filters as Core expects; display IST.
2. Pagination.
3. Do not recompute GST in the client.
4. Sale detail GET /sales/{saleId}.
5. Export only if Core/Bruno supports it.
6. Label this as ledger, not analytics.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/sales` | Bearer | UNAUTHORIZED, MODULE_NOT_IN_PLAN |
| GET | `/api/v1/pharmacy/sales/summary` | Bearer | UNAUTHORIZED, MODULE_NOT_IN_PLAN |
| GET | `/api/v1/pharmacy/sales/{saleId}` | Bearer | SALE_NOT_FOUND, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given GET sales, when filtered, then rows match query.
2. **AC-002**: Given summary, when cards, then payload totals.
3. **AC-003**: Given sale detail, when opened, then GET saleId.
4. **AC-004**: Given export, when Core supports it, then download.
5. **AC-005**: Given empty day, when none, then empty.
6. **AC-006**: Given 404, when bad sale, then not-found.
7. **AC-007**: Given cashier with read, when list, then shown.
8. **AC-008**: Given a11y, when date inputs, then labelled.

## Test requirements

- Unit: Summary cards
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Detail
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-007 STORY-002/004

**Implemented Core references**

- EPIC-007 STORY-004

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
