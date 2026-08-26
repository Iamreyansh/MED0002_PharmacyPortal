# STORY-P013-003: Pharmacy offers CRUD and validate (Growth+)

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P013-003` |
| Epic | [EPIC-P013](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-billing` |
| Minimum plan | `RETAIL_PRO+` |

## Overview

Offers list/create/patch/toggle/delete/validate. Locked Free/Starter.

**Business value:** Local schemes without platform coupons.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/offers`

**Screens / states**

- Offers
- Lock

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Offers table
- Editor
- Validate

### Out of scope

- INDEX platform codes NAMMA25

## Business rules

1. PLAN_FEATURE_LOCKED below RETAIL_PRO.
2. validate used by POS too.
3. Toggle PATCH toggle.
4. Delete confirms.
5. Dates display IST.
6. No platform-wide coupons.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/offers` | Bearer | PLAN_FEATURE_LOCKED, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/offers` | Bearer owner | PLAN_FEATURE_LOCKED, VALIDATION_ERROR, FORBIDDEN, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/offers/validate` | Bearer | PLAN_FEATURE_LOCKED, VALIDATION_ERROR, MODULE_NOT_IN_PLAN |
| PATCH | `/api/v1/pharmacy/offers/{offerId}` | Bearer owner | PLAN_FEATURE_LOCKED, FORBIDDEN, OFFER_NOT_FOUND, MODULE_NOT_IN_PLAN |
| PATCH | `/api/v1/pharmacy/offers/{offerId}/toggle` | Bearer owner | PLAN_FEATURE_LOCKED, FORBIDDEN, OFFER_NOT_FOUND, MODULE_NOT_IN_PLAN |
| DELETE | `/api/v1/pharmacy/offers/{offerId}` | Bearer owner | PLAN_FEATURE_LOCKED, OFFER_NOT_FOUND, FORBIDDEN, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given FREE, when /offers, then lock Growth+.
2. **AC-002**: Given RETAIL_PRO, when GET, then list.
3. **AC-003**: Given create, when POST valid, then appears.
4. **AC-004**: Given toggle, when PATCH toggle, then active flag flips.
5. **AC-005**: Given validate, when POST, then result shown.
6. **AC-006**: Given delete, when confirmed, then gone.
7. **AC-007**: Given VALIDATION_ERROR dates, when create, then fields.
8. **AC-008**: Given a11y, when toggle, then named.

## Test requirements

- Unit: Lock offers
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: CRUD
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-007 STORY-003/005

**Implemented Core references**

- EPIC-007 STORY-005

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
