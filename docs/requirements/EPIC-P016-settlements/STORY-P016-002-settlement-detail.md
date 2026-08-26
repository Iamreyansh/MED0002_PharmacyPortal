# STORY-P016-002: Settlement detail

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P016-002` |
| Epic | [EPIC-P016](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-finance` |
| Minimum plan | `FREE+` |

## Overview

GET settlement by id. Show Core fields only.

**Business value:** Dispute a line using real numbers.

## User roles and access

**Personas**

- `pharmacy_owner`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/finance/settlements/:id`

**Screens / states**

- Settlement detail

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Detail

### Out of scope

- Editing settlement

## Business rules

1. 404 handling.
2. Do not compute commission if Core already netted.
3. Owner-only.
4. Support CTA to /support/new.
5. Read-only.
6. Omit absent fields rather than zero-fill.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/finance/settlements/{id}` | Bearer owner | FORBIDDEN, SETTLEMENT_NOT_FOUND |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given valid id, when GET, then fields render.
2. **AC-002**: Given 404, when unknown, then not-found.
3. **AC-003**: Given staff, when 403.
4. **AC-004**: Given payload keys, when present, then labelled.
5. **AC-005**: Given absent field, when UI, then omitted.
6. **AC-006**: Given support CTA, when clicked, then /support/new.
7. **AC-007**: Given a11y, when definition list, then labels.
8. **AC-008**: Given money formatting ₹.

## Test requirements

- Unit: Detail 404
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: No invented commission
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-012 STORY-003

**Implemented Core references**

- EPIC-012 STORY-003

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
