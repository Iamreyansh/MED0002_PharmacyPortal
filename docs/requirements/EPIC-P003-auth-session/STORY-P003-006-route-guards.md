# STORY-P003-006: Route guards and onboarding gate

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P003-006` |
| Epic | [EPIC-P003](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0002` |
| Screen owner | `host` |
| Minimum plan | `FREE+` |

## Overview

Unauthenticated users cannot open dashboard routes. Non-ACTIVE pharmacies are boxed into onboarding. POS scope boxed into POS.

**Business value:** KYC-incomplete shops cannot pretend to fulfil marketplace orders.

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

- Onboarding redirect

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Auth guard
- Status guard
- Scope guard

### Out of scope

- Admin impersonation

## Business rules

1. Anonymous → `/login` with return URL only for safe GET routes (no storing passwords).
2. PENDING_KYC / KYC_SUBMITTED / REJECTED → allow `/onboarding/*` and `/settings/profile` and `/subscription` as needed; block `/rx-quotes` and `/orders/:id`.
3. SUSPENDED → banner; block storefront online (P005) and marketplace actions.
4. ACTIVE → dashboard.
5. Guards read Core registration-status or login payload; do not guess.
6. Public `/register` accessible when anonymous only.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/registration-status` | Bearer | UNAUTHORIZED |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given no session, when visiting `/inventory`, then redirect `/login`.
2. **AC-002**: Given PENDING_KYC, when visiting `/rx-quotes`, then redirect `/onboarding/status`.
3. **AC-003**: Given ACTIVE, when visiting `/onboarding/status`, then user may still view status but home is `/`.
4. **AC-004**: Given pos scope, when visiting `/inventory`, then stay POS-restricted.
5. **AC-005**: Given SUSPENDED, when visiting `/rx-quotes`, then blocked with suspension copy.
6. **AC-006**: Given return URL `/invoices`, when login succeeds ACTIVE, then land `/invoices`.
7. **AC-007**: Given anonymous, when `/register`, then page loads.
8. **AC-008**: Given authenticated, when `/login`, then redirect `/`.

## Test requirements

- Unit: Guard matrix
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: KYC pharmacy cannot open quotes
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- EPIC-P002
- Core EPIC-001 STORY-002/004

**Implemented Core references**

- EPIC-003 STORY-001

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
