# STORY-P003-004: Multi-pharmacy context switch

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P003-004` |
| Epic | [EPIC-P003](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0002` |
| Screen owner | `host` |
| Minimum plan | `FREE+` |

## Overview

Header switcher calls POST /auth/pharmacy/switch-pharmacy, replaces access token, remounts remotes with new pharmacyId.

**Business value:** Chain staff do not re-type passwords between shops.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/`

**Screens / states**

- Pharmacy switcher

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Switcher
- Token replace
- Remote remount

### Out of scope

- Creating new pharmacy assignments

## Business rules

1. Switcher hidden if pharmacies.length < 2.
2. Forbidden pharmacy_id → 403; keep old context.
3. After switch, inventory/POS must not show previous pharmacy rows (remount).
4. Active pharmacy chip uses active_pharmacy.name.
5. POS scope: switcher hidden (full login required).
6. Do not pass pharmacy_id as query to ERP GETs after switch.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/pharmacy/switch-pharmacy` | Bearer owner\|staff | FORBIDDEN, VALIDATION_ERROR, UNAUTHORIZED |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given two pharmacies, when user selects the other, then switch-pharmacy is POSTed and context.pharmacyId updates.
2. **AC-002**: Given one pharmacy, when header renders, then switcher is hidden.
3. **AC-003**: Given 403, when switch fails, then previous pharmacy remains and an error is shown.
4. **AC-004**: Given remotes, when switch succeeds, then they remount (new mount key).
5. **AC-005**: Given pos token, when header renders, then switcher is absent.
6. **AC-006**: Given in-flight switch, when clicked twice, then one request proceeds.
7. **AC-007**: Given list from login.pharmacies, when a row is_active false, then it is not selectable.
8. **AC-008**: Given a11y, when switcher is a combobox or menu, then it has a name.

## Test requirements

- Unit: Switcher remount key
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Switch forbidden keeps context
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- EPIC-P002
- Core EPIC-001 STORY-002/004

**Implemented Core references**

- EPIC-001 STORY-002

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
