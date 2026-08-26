# STORY-P002-001: Host API request facade

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P002-001` |
| Epic | [EPIC-P002](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0002` |
| Screen owner | `host` |
| Minimum plan | `FREE+` |

## Overview

Implement `capabilities.api.request` against `VITE_API_BASE_URL` using Core success/error envelopes and snake_case JSON.

**Business value:** Every MFE can reach Core without hardcoding bases.

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

- None (library)

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- GET/POST/PUT/PATCH/DELETE JSON
- Envelope parse
- Binary/pdf passthrough flag

### Out of scope

- Multipart (next story if split — include minimal multipart here)

## Business rules

1. Parse `success` boolean; on false return `{ok:false, code, message, details}`.
2. Paths must start with `/api/v1/`.
3. Default `Accept: application/json`.
4. Do not put `pharmacy_id` automatically on query strings.
5. Network failure → `code=NETWORK_ERROR` (portal-local) with Retry guidance.
6. Stub 501 path is removed from production envelope.

## API endpoints

No Core endpoint is introduced or called by this story.

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given a 200 `{success:true,data:{x:1}}`, when request resolves, then ok is true and data.x is 1.
2. **AC-002**: Given a 403 `{success:false,error:{code:PLAN_FEATURE_LOCKED}}`, when request resolves, then ok is false and code is PLAN_FEATURE_LOCKED.
3. **AC-003**: Given no token, when calling a public path, then Authorization is omitted.
4. **AC-004**: Given JSON body, when POST is sent, then keys are snake_case as provided by callers (no camelCase rewrite unless documented).
5. **AC-005**: Given the old stub, when a remote calls api.request, then it no longer receives status 501 by default.
6. **AC-006**: Given invalid JSON on 500, when parse fails, then code is UPSTREAM_INVALID_JSON.
7. **AC-007**: Given path without /api/v1, when called, then the client rejects locally.
8. **AC-008**: Given unit tests, when envelope helpers run, then they cover success and error branches.

## Test requirements

- Unit: Envelope parser
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: n/a library
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- API-INTEGRATION-CONTRACT.md
- EPIC-P001

**Implemented Core references**

- INDEX.md envelopes

**Shared portal requirements**

- `PRODUCT-IDEOLOGY.md`
- `PERSONAS-RBAC-PLAN-MATRIX.md`
- `API-INTEGRATION-CONTRACT.md`
- `DOMAIN-STATE-MACHINES.md`
- `ERROR-AND-RECOVERY-CATALOG.md`
- `UX-ACCESSIBILITY-STANDARDS.md`
- `NON-FUNCTIONAL-REQUIREMENTS.md`

## Notes

- Start from `src/host/envelope.ts`.
