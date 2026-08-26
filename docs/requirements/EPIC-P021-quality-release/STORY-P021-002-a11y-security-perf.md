# STORY-P021-002: Accessibility, security, and performance acceptance

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P021-002` |
| Epic | [EPIC-P021](./EPIC.md) |
| Phase | 4 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0002` |
| Screen owner | `host` |
| Minimum plan | `FREE+` |

## Overview

axe on shell/POS/KYC/checkout. No token in remotes. NFR budgets. 100% host coverage remains.

**Business value:** Counter staff and auditors can use the console.

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

- N/A

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- axe
- token leak tests

### Out of scope

- Pixel-perfect branding

## Business rules

1. WCAG 2.2 AA on named screens.
2. Remotes must not read localStorage.
3. No CASHFREE_SECRET_KEY in VITE.
4. Host unit coverage 100%.
5. POS autofocus accessible.
6. prefers-reduced-motion honoured.

## API endpoints

No Core endpoint is introduced or called by this story.

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given axe on `/` logged in, when run, then no serious/critical.
2. **AC-002**: Given POS, when axe, then no critical.
3. **AC-003**: Given envelope, when remote mock, then no refresh_token.
4. **AC-004**: Given .env.example, when inspected, then no secret payment keys.
5. **AC-005**: Given coverage, when host unit, then 100% gate still on.
6. **AC-006**: Given keyboard POS, when tab, then search then cart then pay.
7. **AC-007**: Given reduced motion, when OS flag, then no required animation.
8. **AC-008**: Given perf budget miss, when found, then fail until remotes split.

## Test requirements

- Unit: axe smoke
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: token leak
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Prior epics as they land

**Implemented Core references**

- NFR

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
