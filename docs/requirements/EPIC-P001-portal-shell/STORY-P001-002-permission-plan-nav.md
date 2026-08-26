# STORY-P001-002: Permission- and plan-aware navigation

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P001-002` |
| Epic | [EPIC-P001](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0002` |
| Screen owner | `host` |
| Minimum plan | `FREE+` |

## Overview

Nav visibility uses envelope permissions (omit) and plan locks (show disabled + lock). POS scope shows only POS.

**Business value:** Staff never hunt for modules they cannot use; locked Growth features remain discoverable.

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

- Sidebar with mixed live/locked items

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Nav filtering
- Lock rows
- POS nav allowlist

### Out of scope

- Fetching plans from API (consume envelope/context supplied by P003)

## Business rules

1. Missing permission → omit item.
2. Plan below minimum → show locked item with `data-testid=plan-lock` linking `/subscription`.
3. `token_scope=pos` → only `/pos` (and logout).
4. Owner-only items omitted for `pharmacy_staff` even if permissions include `*`.
5. Pharmacy not ACTIVE → fulfilment marketplace items omitted; onboarding links shown.
6. Khata min STARTER, analytics/distributors/reorder/offers min RETAIL_PRO.

## API endpoints

No Core endpoint is introduced or called by this story.

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given cashier permissions, when nav renders, then Settings → Roles is omitted.
2. **AC-002**: Given FREE plan, when nav renders, then Khata is visible locked with upgrade link.
3. **AC-003**: Given RETAIL_PRO, when nav renders, then Analytics is enabled.
4. **AC-004**: Given pos scope, when any `/settings` path is requested, then the host stays on `/pos`.
5. **AC-005**: Given PENDING_KYC, when nav renders, then `/rx-quotes` is omitted and `/onboarding/kyc` is shown.
6. **AC-006**: Given pharmacy_staff, when nav renders, then Settlements is omitted.
7. **AC-007**: Given ENTERPRISE display Pro, when a lock is shown, then copy uses display labels not raw enums only.
8. **AC-008**: Given a locked item, when activated, then focus moves to the lock explanation, not a blank module.

## Test requirements

- Unit: Nav matrix table-driven tests
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Locked Khata on Free fixture
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- MED0003 contracts
- INFORMATION-ARCHITECTURE.md

**Implemented Core references**

- EPIC-001 STORY-005
- EPIC-014 STORY-001

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
