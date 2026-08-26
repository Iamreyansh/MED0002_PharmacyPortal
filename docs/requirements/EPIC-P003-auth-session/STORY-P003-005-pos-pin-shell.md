# STORY-P003-005: POS PIN login and POS-scoped shell

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P003-005` |
| Epic | [EPIC-P003](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0002` |
| Screen owner | `mfe-auth` |
| Minimum plan | `FREE+` |

## Overview

4-digit PIN login issues token_scope=pos (4h). Host forces POS chrome. Non-POS API and routes blocked.

**Business value:** Counter opens fast without exposing settings.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/pos-login`
- `/pos`

**Screens / states**

- PIN keypad
- POS chrome

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- PIN keypad
- POS shell
- POS_TOKEN_RESTRICTED handling

### Out of scope

- Setting the PIN (no staff PIN API) — if PIN unset, show Core error

## Business rules

1. PIN is exactly 4 digits; numeric keypad.
2. Token cannot be used outside /api/v1/pharmacy/pos/**.
3. Host route allowlist: `/pos` and logout/pos-login only.
4. Unset PIN → show Core error; do not add a set-PIN form.
5. Failed PIN attempts follow Core lockout codes if returned.
6. Full-login users may still open `/pos` with full token (POS MFE); PIN is the restricted path.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/pharmacy/pos-pin` | public | VALIDATION_ERROR, ACCOUNT_LOCKED, POS_PIN_NOT_SET, INVALID_PIN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given valid PIN payload as Core expects, when login succeeds, then token_scope is pos and route is `/pos`.
2. **AC-002**: Given pos session, when user navigates `/analytics`, then host refuses and stays in POS chrome.
3. **AC-003**: Given pos session, when a remote calls /pharmacy/inventory, then UI surfaces POS_TOKEN_RESTRICTED.
4. **AC-004**: Given invalid PIN, when Core returns INVALID_PIN, then keypad clears and errors.
5. **AC-005**: Given 4 digits not yet complete, when submit, then client prevents send.
6. **AC-006**: Given logout from POS, when done, then `/pos-login`.
7. **AC-007**: Given full token user opening `/pos`, when allowed, then POS MFE loads without PIN.
8. **AC-008**: Given keypad, when using keyboard 0-9, then digits fill.

## Test requirements

- Unit: POS route allowlist
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: PIN login mock
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- EPIC-P002
- Core EPIC-001 STORY-002/004

**Implemented Core references**

- EPIC-001 STORY-002
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

- If Core error code for missing PIN differs, use the actual code from Bruno/controller — do not invent POS_PIN_NOT_SET if Core uses another code.
