# STORY-P005-003: Storefront online/offline

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P005-003` |
| Epic | [EPIC-P005](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-settings` |
| Minimum plan | `FREE+` |

## Overview

Owner PATCH /pharmacy/storefront. Honour ADMIN_OVERRIDE_ACTIVE. Online visibility of SKUs remains inventory Growth+ (P009).

**Business value:** Shop can pause marketplace demand at close.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/settings/storefront`

**Screens / states**

- Storefront settings

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Online toggle
- Override banner

### Out of scope

- Admin zone editor

## Business rules

1. Owner-only PATCH.
2. ADMIN_OVERRIDE_ACTIVE disables toggle with explanation.
3. SUSPENDED pharmacy cannot go online.
4. Success refreshes status chip in header via host event/capability.
5. Do not toggle is_online_visible for products here.
6. Confirm going offline if Core does not already confirm.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| PATCH | `/api/v1/pharmacy/storefront` | Bearer owner | FORBIDDEN, ADMIN_OVERRIDE_ACTIVE, VALIDATION_ERROR |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given owner, when toggling offline, then PATCH storefront is sent.
2. **AC-002**: Given ADMIN_OVERRIDE_ACTIVE, when toggle, then it is disabled and message shown.
3. **AC-003**: Given staff, when page, then read-only or hidden write.
4. **AC-004**: Given success, when header chip, then it updates without full reload if capability exists, else reload.
5. **AC-005**: Given validation error, when hours conflict, then shown.
6. **AC-006**: Given SUSPENDED, when attempting online, then blocked.
7. **AC-007**: Given confirm, when going offline, then dialog names the pharmacy.
8. **AC-008**: Given a11y, when switch, then it has an accessible name.

## Test requirements

- Unit: Override disables toggle
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Patch storefront
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- EPIC-P003
- Core EPIC-003 STORY-005
- EPIC-004 STORY-004

**Implemented Core references**

- EPIC-004 STORY-004

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
