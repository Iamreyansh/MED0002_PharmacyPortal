# STORY-P021-003: Failure recovery drills

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P021-003` |
| Epic | [EPIC-P021](./EPIC.md) |
| Phase | 4 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0002` |
| Screen owner | `host` |
| Minimum plan | `FREE+` |

## Overview

UX for remote 404, API 5xx, 429, refresh fail, unpaid Cashfree return, order 404, offline checkout block.

**Business value:** Ops can predict what pharmacists see.

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

- Error banners

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Recovery tests

### Out of scope

- PagerDuty

## Business rules

1. No infinite retry loops.
2. Checkout 5xx retries only on user Retry with same key.
3. Offline checkout blocked.
4. MFE fail isolated.
5. Copy from ERROR catalog.
6. Each drill has a testid.

## API endpoints

No Core endpoint is introduced or called by this story.

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given API 503 GET, when retry policy, then one automatic retry then banner.
2. **AC-002**: Given 429, when retry_after_seconds, then wait shown.
3. **AC-003**: Given refresh fail, when 401, then login.
4. **AC-004**: Given remote 404, when module, then remote-error.
5. **AC-005**: Given unpaid billing return, when still due, then not success.
6. **AC-006**: Given order 404 deep link, when opened, then not-found.
7. **AC-007**: Given offline, when checkout, then blocked.
8. **AC-008**: Given missing capability, when remote, then host does not throw.

## Test requirements

- Unit: Retry policy
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: offline checkout
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Prior epics as they land

**Implemented Core references**

- ERROR-AND-RECOVERY-CATALOG.md

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
