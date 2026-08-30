# STORY-P018-002: Browser/device token register and unregister

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P018-002` |
| Epic | [EPIC-P018](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0002` |
| Screen owner | `host` |
| Minimum plan | `FREE+` |

## Overview

Host POST/DELETE /pharmacy/me/device-token. Unregister on logout. Failures non-blocking.

**Business value:** Order deep-link pushes can arrive.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- No user-facing route.

**Screens / states**

- Browser permission prompt

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Token lifecycle

### Out of scope

- Inbox UI

## Business rules

1. Never log token.
2. Permission denied → skip.
3. DELETE on logout.
4. Skip on pos token (non-pos path).
5. Body per Core (token, platform).
6. Does not block login.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/pharmacy/me/device-token` | Bearer | VALIDATION_ERROR |
| DELETE | `/api/v1/pharmacy/me/device-token` | Bearer | UNAUTHORIZED |
| POST | `/api/v1/notifications/push/opened` | Bearer | VALIDATION_ERROR |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given permission granted, when token, then POST device-token.
2. **AC-002**: Given logout, when session ends, then DELETE attempted.
3. **AC-003**: Given permission denied, when login, then no crash.
4. **AC-004**: Given VALIDATION_ERROR, when ignored non-blocking.
5. **AC-005**: Given pos token, when POS, then skip register.
6. **AC-006**: Given duplicate POST, when same token, then ignore Core duplicate if any.
7. **AC-007**: Given telemetry, when emitted, then no token/PII.
8. **AC-008**: Given unit, when logout, then unregister attempted even if POST failed.

## Test requirements

- Unit: Register/unregister
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Logout deletes token
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-017 STORY-001/005

**Implemented Core references**

- EPIC-017 STORY-001

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
