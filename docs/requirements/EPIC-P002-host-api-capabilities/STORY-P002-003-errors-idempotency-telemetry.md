# STORY-P002-003: Error mapping, idempotency keys, retries, telemetry

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P002-003` |
| Epic | [EPIC-P002](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0002` |
| Screen owner | `host` |
| Minimum plan | `FREE+` |

## Overview

Standardise Idempotency-Key on payment-like mutators, GET retry, and telemetry without PII.

**Business value:** Double-click checkout and plan locks behave predictably.

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

- None

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Idempotency-Key
- 429 retry_after_seconds
- telemetry events

### Out of scope

- Business toasts inside remotes (they consume mapped errors)

## Business rules

1. Checkout, billing pay, subscribe, upgrade, khata repayment: host generates UUID v4 key per user intent; retries reuse it.
2. GET retries once on 503/429/network; POST without key does not auto-retry.
3. Telemetry: api_error with code only; never identifier, Rx, bank.
4. Multipart requests still can carry Authorization and idempotency when specified by the story.
5. PLAN_* and MODULE_NOT_IN_PLAN are passed through unchanged.
6. POS_TOKEN_RESTRICTED is passed through unchanged.

## API endpoints

No Core endpoint is introduced or called by this story.

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given POS checkout, when called via facade with idempotencyKey, then header Idempotency-Key is present.
2. **AC-002**: Given the same checkout retry, when the user clicks Retry, then the key is unchanged.
3. **AC-003**: Given a new checkout, when a new cart is paid, then a new key is used.
4. **AC-004**: Given 429 with retry_after_seconds 2, when GET retries, then it waits at least that long.
5. **AC-005**: Given POST 500 without key, when the client returns, then it does not automatically retry.
6. **AC-006**: Given PLAN_FEATURE_LOCKED, when telemetry fires, then payload has code PLAN_FEATURE_LOCKED only.
7. **AC-007**: Given NETWORK_ERROR, when returned, then remotes can show Retry.
8. **AC-008**: Given unit tests, when header builder runs, then it never logs tokens.

## Test requirements

- Unit: Idempotency header helper
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: n/a
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- API-INTEGRATION-CONTRACT.md
- EPIC-P001

**Implemented Core references**

- Reliability rules
- EPIC-001

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
