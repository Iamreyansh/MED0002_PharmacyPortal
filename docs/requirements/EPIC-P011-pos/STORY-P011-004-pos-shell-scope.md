# STORY-P011-004: POS MFE under pos-scoped token

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P011-004` |
| Epic | [EPIC-P011](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0002` |
| Screen owner | `mfe-pos` |
| Minimum plan | `FREE+` |

## Overview

POS MFE may call only /pharmacy/pos/**. Invoice PDF is not a POS path — skip under PIN token.

**Business value:** PIN login cannot leak ERP writes.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/pos`

**Screens / states**

- POS-only chrome

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Allowlist tests

### Out of scope

- New endpoints

## Business rules

1. No inventory/settings/SaaS calls from POS MFE.
2. Invoice PDF after checkout under pos token: show ‘open after full login’.
3. capabilities.navigate to settings ignored in pos scope.
4. Logout via host still allowed.
5. Tests fail if POS client includes non-pos paths.
6. POS_TOKEN_RESTRICTED surfaced if leaked call happens.

## API endpoints

No Core endpoint is introduced or called by this story.

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given pos token, when POS MFE loads, then it only requests /api/v1/pharmacy/pos/**.
2. **AC-002**: Given invoice id after checkout, when token is pos, then PDF is not fetched.
3. **AC-003**: Given navigate('/analytics'), when pos, then ignored.
4. **AC-004**: Given unit tests, when scanning POS API calls, then no inventory paths.
5. **AC-005**: Given full token on /pos, when PDF wanted, then P012 may open.
6. **AC-006**: Given POS_TOKEN_RESTRICTED, when accidental call, then inline error.
7. **AC-007**: Given host pos chrome, when rendered, then no settings nav.
8. **AC-008**: Given e2e PIN sale, when network log, then no settings requests.

## Test requirements

- Unit: POS path allowlist
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: PIN sale without settings calls
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-007 STORY-001
- EPIC-P003-005

**Implemented Core references**

- PosTokenRestrictionFilter

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
