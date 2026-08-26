# STORY-P002-002: JWT attach, refresh single-flight, and 401 recovery

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P002-002` |
| Epic | [EPIC-P002](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0002` |
| Screen owner | `host` |
| Minimum plan | `FREE+` |

## Overview

Attach access tokens, refresh once on 401 via POST /api/v1/auth/refresh, then retry the original request. Failure routes to login.

**Business value:** 15-minute access tokens do not kick cashiers mid-bill if refresh still valid.

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

- Redirect to /login on session death

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Authorization header
- refresh_token use
- logout on refresh fail

### Out of scope

- Login form

## Business rules

1. Only one in-flight refresh shared by concurrent 401s.
2. Refresh body `{ refresh_token }` snake_case.
3. POS scope tokens still attach; they must not be used to call non-POS APIs (caller/nav responsibility).
4. Never pass refresh_token into MFE feature payloads.
5. After logout, in-memory tokens are cleared.
6. GET /api/v1/auth/me is the session bootstrap used by P003.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/refresh` | public body token | VALIDATION_ERROR, REFRESH_TOKEN_INVALID, REFRESH_TOKEN_EXPIRED, REFRESH_TOKEN_REUSED |
| GET | `/api/v1/auth/me` | Bearer | UNAUTHORIZED |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given a stored access token, when a remote calls API, then Authorization Bearer is set.
2. **AC-002**: Given 401 then successful refresh, when two GETs fail together, then refresh is called once and both retry.
3. **AC-003**: Given refresh 401, when recovery runs, then session is cleared and location is `/login`.
4. **AC-004**: Given last scope pos, when refresh fails, then location is `/pos-login`.
5. **AC-005**: Given remotes, when inspecting envelope, then refresh_token is absent.
6. **AC-006**: Given 200 after retry, when UI resumes, then the user is not bounced to login.
7. **AC-007**: Given no session, when 401 occurs on public login, then client does not refresh-loop.
8. **AC-008**: Given clock skew, when access_token_expires_in is provided at login, then host may proactively refresh before expiry (optional, must not double-refresh).

## Test requirements

- Unit: Single-flight refresh
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Expired session lands on login
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- API-INTEGRATION-CONTRACT.md
- EPIC-P001

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
