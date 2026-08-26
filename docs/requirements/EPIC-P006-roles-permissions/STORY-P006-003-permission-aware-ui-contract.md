# STORY-P006-003: Document permission-aware UI contract for remotes

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P006-003` |
| Epic | [EPIC-P006](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0002` |
| Screen owner | `host` |
| Minimum plan | `FREE+` |

## Overview

Host passes context.permissions into every envelope. Remotes hide writes they cannot perform. This story is the contract test harness, not a new API.

**Business value:** Cashiers never see Delete mapping.

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

- N/A

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Envelope permissions tests
- Helper can(permission)

### Out of scope

- Role APIs

## Business rules

1. Permissions come from login/me/Core — host must not hardcode ['todo:read'].
2. Helper supports `resource:action` and `resource:*` and `*`.
3. Remotes still handle 403 INSUFFICIENT_PERMISSIONS.
4. POS scope implies only POS capabilities regardless of permission list.
5. Tests cover cashier vs pharmacist vs owner fixtures.
6. No staff directory screen.

## API endpoints

No Core endpoint is introduced or called by this story.

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given cashier fixture, when can('inventory:write'), then false.
2. **AC-002**: Given owner `*`, when can('reports:read'), then true.
3. **AC-003**: Given pharmacist, when can('prescriptions:verify'), then true.
4. **AC-004**: Given empty permissions, when can anything, then false except public.
5. **AC-005**: Given pos scope, when can inventory write, then host still blocks routes.
6. **AC-006**: Given 403 INSUFFICIENT_PERMISSIONS, when remote shows, then no upgrade CTA.
7. **AC-007**: Given demo todo permissions, when production envelope, then they are absent.
8. **AC-008**: Given unit tests, when wildcard, then child actions pass.

## Test requirements

- Unit: can() matrix
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: n/a
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-001 STORY-005

**Implemented Core references**

- EPIC-001 STORY-005

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
