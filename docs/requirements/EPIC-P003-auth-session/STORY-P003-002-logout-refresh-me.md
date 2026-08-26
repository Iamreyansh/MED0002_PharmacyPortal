# STORY-P003-002: Logout, logout-all, and session bootstrap

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P003-002` |
| Epic | [EPIC-P003](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0002` |
| Screen owner | `mfe-auth` |
| Minimum plan | `FREE+` |

## Overview

Header session menu: me, logout current, logout all devices. Bootstrap via GET /auth/me on load.

**Business value:** Staff can leave a shared counter computer safely.

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

- Session menu

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- GET /auth/me
- POST /auth/logout
- POST /auth/logout-all

### Out of scope

- Session list UI (next story)

## Business rules

1. Logout sends refresh_token as required by Core DTO.
2. Logout-all revokes all sessions for the principal.
3. Failed logout still clears local session (fail-safe) and routes to login.
4. Me bootstrap 401 → login.
5. Display staff.name from me/login payload; no demo-user in production.
6. Do not keep demo-pharmacy context after this story.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/auth/me` | Bearer | UNAUTHORIZED |
| POST | `/api/v1/auth/logout` | Bearer | UNAUTHORIZED, VALIDATION_ERROR |
| POST | `/api/v1/auth/logout-all` | Bearer | UNAUTHORIZED |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given a session, when the app loads, then GET /auth/me runs and envelope context.userId matches.
2. **AC-002**: Given Logout, when Core returns ok, then tokens are gone and `/login` shows.
3. **AC-003**: Given Logout all, when ok, then all devices are revoked per Core and this client is logged out.
4. **AC-004**: Given me 401, when bootstrap fails, then user is on `/login`.
5. **AC-005**: Given demo constants, when production build, then hostId remains pharmacy-portal but pharmacyId is not `demo-pharmacy`.
6. **AC-006**: Given logout network fail, when local clear still happens, then user is not stuck authenticated locally.
7. **AC-007**: Given staff name, when header renders, then it is not `demo-user`.
8. **AC-008**: Given POS scope, when logout, then `/pos-login` is the landing page.

## Test requirements

- Unit: Logout clears session
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Me bootstrap
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- EPIC-P002
- Core EPIC-001 STORY-002/004

**Implemented Core references**

- EPIC-001 STORY-004

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
