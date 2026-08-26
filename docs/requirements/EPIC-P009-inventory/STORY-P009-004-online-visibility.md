# STORY-P009-004: Online visibility toggle (Growth+)

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P009-004` |
| Epic | [EPIC-P009](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-inventory` |
| Minimum plan | `RETAIL_PRO+` |

## Overview

Setting is_online_visible true on Free/Starter returns PLAN_FEATURE_LOCKED. Growth+ may toggle; Schedule X still blocked via mapping rules.

**Business value:** Only paid online stores list stock on the customer app.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/inventory/:productId`

**Screens / states**

- Online toggle

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Toggle + lock

### Out of scope

- Customer app

## Business rules

1. FREE/STARTER: lock component, do not send true.
2. RETAIL_PRO+: PATCH product with is_online_visible as Core field name.
3. Storefront offline is independent (P005) — show both states.
4. SCHEDULE_X handled on mapping; if inventory toggle exists, still handle Core error.
5. Online-visibility writes are owner-only; staff receive read-only product state.
6. Telemetry not required beyond plan_lock_shown.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| PATCH | `/api/v1/pharmacy/inventory/{productId}` | Bearer owner | PLAN_FEATURE_LOCKED, VALIDATION_ERROR, PRODUCT_NOT_FOUND, FORBIDDEN, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given FREE, when toggle on, then lock panel not a successful PATCH true.
2. **AC-002**: Given RETAIL_PRO, when toggle, then PATCH sent.
3. **AC-003**: Given PLAN_FEATURE_LOCKED, when Core still called, then lock shown.
4. **AC-004**: Given storefront offline, when product online, then hint that store is offline.
5. **AC-005**: Given cashier, when toggle hidden, then read-only.
6. **AC-006**: Given failure, when 500, then previous state restored.
7. **AC-007**: Given a11y, when switch, then named.
8. **AC-008**: Given Growth label, when lock, then says Growth not RETAIL_PRO in primary copy.

## Test requirements

- Unit: Free cannot enable online
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Pro toggle patch
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
