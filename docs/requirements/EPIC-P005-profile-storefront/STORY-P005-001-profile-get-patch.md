# STORY-P005-001: View and edit pharmacy profile

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P005-001` |
| Epic | [EPIC-P005](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-settings` |
| Minimum plan | `FREE+` |

## Overview

GET/PATCH /pharmacy/profile. Staff read; owner patch. Some field changes may require Core approval/OTP — show returned state, do not invent a second workflow.

**Business value:** Hours, address, and display name stay accurate for customers.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/settings/profile`

**Screens / states**

- Profile form

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Profile form

### Out of scope

- Logo CDN pipeline beyond Core fields

## Business rules

1. PATCH owner-only.
2. Never send pharmacy_id in query.
3. If Core returns pending-approval fields, show as pending.
4. Hours timezone display IST.
5. Validation maps field errors.
6. Unsaved navigation confirms.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/profile` | Bearer | UNAUTHORIZED |
| PATCH | `/api/v1/pharmacy/profile` | Bearer owner | FORBIDDEN, VALIDATION_ERROR |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given staff, when page loads, then GET profile renders and PATCH controls are disabled.
2. **AC-002**: Given owner, when valid PATCH, then success toast and GET refresh.
3. **AC-003**: Given VALIDATION_ERROR, when PATCH, then fields highlight.
4. **AC-004**: Given 403, when staff force PATCH, then forbidden copy.
5. **AC-005**: Given loading, when GET in flight, then skeleton.
6. **AC-006**: Given dirty form, when leaving, then confirm.
7. **AC-007**: Given empty optional fields, when GET, then inputs empty not undefined crash.
8. **AC-008**: Given a11y, when hours inputs, then labelled.

## Test requirements

- Unit: Profile owner vs staff
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Patch success
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- EPIC-P003
- Core EPIC-003 STORY-005
- EPIC-004 STORY-004

**Implemented Core references**

- EPIC-003 STORY-005

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
