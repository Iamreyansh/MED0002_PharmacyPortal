# STORY-P003-001: Pharmacy staff login

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P003-001` |
| Epic | [EPIC-P003](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0002` |
| Screen owner | `mfe-auth` |
| Minimum plan | `FREE+` |

## Overview

Public login with identifier (email or +91 phone) and password. Optional pharmacy_id if known. Persist tokens in host; redirect to `/` or onboarding.

**Business value:** Owners and staff can enter the console.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/login`

**Screens / states**

- Login

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Login form
- Error codes table
- Redirect by pharmacy status

### Out of scope

- SSO
- Forgot-password API if Core has none — do not invent

## Business rules

1. Identifier is email or +91 phone as Core specifies.
2. Do not invent password-reset endpoints.
3. On success store access_token, refresh_token, token_type, pharmacies, staff, active_pharmacy.
4. Map INVALID_CREDENTIALS, ACCOUNT_LOCKED (show unlock_at), ACCOUNT_SUSPENDED, STAFF_NOT_FOUND, VALIDATION_ERROR.
5. Rate-limit UX: disable submit while in-flight; honour 429.
6. Password field is masked; no telemetry of identifier.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/pharmacy/login` | public | VALIDATION_ERROR, INVALID_CREDENTIALS, ACCOUNT_LOCKED, ACCOUNT_SUSPENDED, STAFF_NOT_FOUND |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given valid credentials, when submit succeeds, then host has access_token and user lands on `/` or onboarding.
2. **AC-002**: Given wrong password, when 401 INVALID_CREDENTIALS, then the form shows Core message and does not reveal which field.
3. **AC-003**: Given ACCOUNT_LOCKED, when details.unlock_at exists, then it is shown in IST.
4. **AC-004**: Given empty fields, when submit, then client validation runs before network.
5. **AC-005**: Given in-flight, when click submit again, then a second POST is not sent.
6. **AC-006**: Given authenticated user visiting `/login`, when session valid, then redirect `/`.
7. **AC-007**: Given keyboard, when tabbing, then identifier → password → submit.
8. **AC-008**: Given STAFF_NOT_FOUND, when returned, then copy uses Core message.

## Test requirements

- Unit: Login form errors
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Login happy path against mock
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- EPIC-P002
- Core EPIC-001 STORY-002/004

**Implemented Core references**

- EPIC-001 STORY-002

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
