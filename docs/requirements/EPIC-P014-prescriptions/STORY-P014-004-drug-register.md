# STORY-P014-004: Schedule H1/X drug register

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P014-004` |
| Epic | [EPIC-P014](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-rx` |
| Minimum plan | `FREE+` |

## Overview

GET /pharmacy/compliance/drug-register with Core filters.

**Business value:** Inspector-ready register view.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/compliance/drug-register`

**Screens / states**

- Drug register

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Register table

### Out of scope

- Admin compliance filings

## Business rules

1. The pharmacy drug register is available on Free and above; no Starter plan gate applies.
2. Register rows are read-only and cannot be edited or deleted from the portal.
3. Filters use only the query fields implemented by Core.
4. The portal shows only patient/prescriber fields returned by Core and adds no PII columns.
5. Retention rules are owner-only and are displayed as server-authored compliance guidance.
6. Exports are offered only when the implemented endpoint explicitly supports them.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/compliance/drug-register` | Bearer | UNAUTHORIZED |
| GET | `/api/v1/admin/compliance/drug-register/retention-rules` | Bearer pharmacy owner | FORBIDDEN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given a Free pharmacy actor, when the drug-register GET succeeds, then returned dispense rows are displayed without an upgrade lock.
2. **AC-002**: Given supported register filters, when the actor applies them, then the request query matches the Core DTO.
3. **AC-003**: Given Core returns no register rows, when loading completes, then an explanatory empty state is displayed.
4. **AC-004**: Given pharmacy staff, when the register renders, then no edit or delete action is available.
5. **AC-005**: Given an owner, when retention rules are requested, then the server-authored retention guidance is displayed.
6. **AC-006**: Given assistive technology, when the register table renders, then all columns and compliance states are labelled.

## Test requirements

- Unit: Register table
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Filters
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-008 STORY-002/004

**Implemented Core references**

- EPIC-008 STORY-004

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
