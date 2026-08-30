# STORY-P015-001: Rx quote list, quote, decline

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P015-001` |
| Epic | [EPIC-P015](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-orders` |
| Minimum plan | `FREE+` |

## Overview

GET /pharmacy/rx-quotes, POST quote, POST decline.

**Business value:** Pharmacy can bid on uploaded prescriptions.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/rx-quotes`

**Screens / states**

- Quote queue
- Quote form

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Queue
- Quote form
- Decline

### Out of scope

- Broadcast internals

## Business rules

1. States NOTIFIED/REVIEWING/QUOTED/OUT_OF_STOCK/EXPIRED.
2. EXPIRED read-only.
3. PRICE_ABOVE_MRP possible.
4. Decline reason if required.
5. ACTIVE pharmacy only.
6. Pagination.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/rx-quotes` | Bearer | UNAUTHORIZED |
| POST | `/api/v1/pharmacy/rx-quotes/{id}/quote` | Bearer | VALIDATION_ERROR, PRICE_ABOVE_MRP |
| POST | `/api/v1/pharmacy/rx-quotes/{id}/decline` | Bearer | VALIDATION_ERROR |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given GET quotes, when loaded, then slots list.
2. **AC-002**: Given quote POST, when valid, then status QUOTED on refresh.
3. **AC-003**: Given decline, when confirmed, then Core declined status on refresh.
4. **AC-004**: Given EXPIRED, when actions, then hidden.
5. **AC-005**: Given PRICE_ABOVE_MRP, when quote, then error.
6. **AC-006**: Given empty, when none, then empty.
7. **AC-007**: Given PENDING_KYC, when visiting, then guard blocks.
8. **AC-008**: Given a11y, when prices, then labelled.

## Test requirements

- Unit: Quote POST
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Expired read-only
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-010 STORY-003
- PharmacyOrderLifecycleController

**Implemented Core references**

- EPIC-010 STORY-003

**Shared portal requirements**

- `PRODUCT-IDEOLOGY.md`
- `PERSONAS-RBAC-PLAN-MATRIX.md`
- `API-INTEGRATION-CONTRACT.md`
- `DOMAIN-STATE-MACHINES.md`
- `ERROR-AND-RECOVERY-CATALOG.md`
- `UX-ACCESSIBILITY-STANDARDS.md`
- `NON-FUNCTIONAL-REQUIREMENTS.md`

## Notes

- Orders remote quote queue; host onSubmit for GET/POST quote and decline; Free+ with no plan lock.
