# STORY-P007-004: Global plan-lock and upgrade prompt

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P007-004` |
| Epic | [EPIC-P007](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0002` |
| Screen owner | `host` |
| Minimum plan | `FREE+` |

## Overview

Shared lock panel for PLAN_FEATURE_LOCKED, PLAN_UPGRADE_REQUIRED, MODULE_NOT_IN_PLAN used by remotes via capability or shared UI package.

**Business value:** Every paywall looks the same and routes to /subscription.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `*`

**Screens / states**

- Lock panel

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Lock component
- Minimum plan mapping

### Out of scope

- Changing Core gates

## Business rules

1. Khata → Starter; analytics/distributors/reorder/offers/online visibility → Growth; Rx queue → Starter.
2. CTA `/subscription`.
3. No fake tables behind the lock.
4. Staff see lock without pay CTA if owner-only subscribe — copy: ask owner.
5. Telemetry plan_lock_shown with code only.
6. Do not treat INSUFFICIENT_PERMISSIONS as a plan lock.

## API endpoints

No Core endpoint is introduced or called by this story.

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given PLAN_FEATURE_LOCKED on khata, when shown, then Starter+ and link /subscription.
2. **AC-002**: Given PLAN_UPGRADE_REQUIRED on analytics, when shown, then Growth+.
3. **AC-003**: Given MODULE_NOT_IN_PLAN, when shown, then same pattern.
4. **AC-004**: Given INSUFFICIENT_PERMISSIONS, when shown, then no upgrade link.
5. **AC-005**: Given staff, when lock, then ask-owner copy if owner-only billing.
6. **AC-006**: Given telemetry, when shown, then plan_lock_shown.
7. **AC-007**: Given keyboard, when CTA, then focusable.
8. **AC-008**: Given data-testid plan-lock, when e2e, then it exists.

## Test requirements

- Unit: Lock vs permission
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Khata lock copy
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-014
- Cashfree pg checkout fields from pay response

**Implemented Core references**

- EPIC-014
- service gates

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
