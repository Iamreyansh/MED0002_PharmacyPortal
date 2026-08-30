# STORY-P017-003: GST accounts and report catalogue favorites (owner)

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P017-003` |
| Epic | [EPIC-P017](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-analytics` |
| Minimum plan | `RETAIL_PRO+` |

## Overview

GET accounts-gst, reports-catalogue, report by id, PATCH favorite.

**Business value:** GST working papers without Admin HQ.

## User roles and access

**Personas**

- `pharmacy_owner`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/analytics`

**Screens / states**

- GST
- Reports

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- GST view
- Report list
- Favorite

### Out of scope

- GSTR-8 submit

## Business rules

1. Owner-only gst/favorites.
2. PLAN_UPGRADE_REQUIRED still applies.
3. Do not file GST.
4. FY filters.
5. 404 report.
6. Staff 403 on owner routes.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/analytics/accounts-gst` | Bearer owner | PLAN_UPGRADE_REQUIRED, FORBIDDEN |
| GET | `/api/v1/pharmacy/analytics/reports-catalogue` | Bearer | PLAN_UPGRADE_REQUIRED |
| GET | `/api/v1/pharmacy/analytics/reports/{reportId}` | Bearer | PLAN_UPGRADE_REQUIRED, REPORT_NOT_FOUND |
| PATCH | `/api/v1/pharmacy/analytics/reports/{reportId}/favorite` | Bearer owner | FORBIDDEN, PLAN_UPGRADE_REQUIRED |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given owner Growth, when accounts-gst, then data renders.
2. **AC-002**: Given staff, when gst, then 403.
3. **AC-003**: Given catalogue, when GET, then reports listed.
4. **AC-004**: Given favorite, when owner PATCH, then flagged.
5. **AC-005**: Given reportId, when GET, then body shown.
6. **AC-006**: Given FREE, when lock.
7. **AC-007**: Given 404 report, when unknown.
8. **AC-008**: Given a11y, when favorite, then named toggle.

## Test requirements

- Unit: Owner GST
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Favorite
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
