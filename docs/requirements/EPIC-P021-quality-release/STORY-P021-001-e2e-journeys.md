# STORY-P021-001: End-to-end pharmacy journeys

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P021-001` |
| Epic | [EPIC-P021](./EPIC.md) |
| Phase | 4 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0002` |
| Screen owner | `host` |
| Minimum plan | `FREE+` |

## Overview

Playwright: login, KYC, POS, invoice, plan lock, quote, order action with known id, logout. No Todo. No GET /pharmacy/orders.

**Business value:** Federation seams do not break the shop day.

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

- e2e specs

### Out of scope

- Admin HQ

## Business rules

1. data-testid from stories.
2. Secrets from env.
3. Skip missing fixtures instead of fake pass.
4. PIN journey separate.
5. No order list GET.
6. No Todo in default suite.

## API endpoints

No Core endpoint is introduced or called by this story.

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given default e2e, when home, then no Todo assertion required.
2. **AC-002**: Given login fixture, when run, then dashboard chrome visible.
3. **AC-003**: Given POS journey, when checkout, then pos-checkout covered.
4. **AC-004**: Given Free user, when khata, then plan-lock.
5. **AC-005**: Given logout, when run, then login shown.
6. **AC-006**: Given remote-error fixture, when forced, then chrome remains.
7. **AC-007**: Given CI quality workflow, when e2e, then gated as repo policy.
8. **AC-008**: Given tests, when network, then GET /pharmacy/orders is never called.

## Test requirements

- Playwright journeys listed in AC

## Dependencies and references

**Epic dependencies**

- Prior epics as they land

**Implemented Core references**

- multiple

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
