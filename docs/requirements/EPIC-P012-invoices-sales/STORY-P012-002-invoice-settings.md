# STORY-P012-002: Invoice settings

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P012-002` |
| Epic | [EPIC-P012](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-billing` |
| Minimum plan | `FREE+` |

## Overview

GET/PATCH /pharmacy/invoice-settings. Do not call admin e-invoice IRN APIs.

**Business value:** Bills show the legal pharmacy identity.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/invoice-settings`

**Screens / states**

- Invoice settings

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Settings form

### Out of scope

- /integrations/einvoice

## Business rules

1. Owner vs staff follows Core.
2. No einvoice IRN buttons.
3. GSTIN validation if field exists.
4. Unsaved confirm.
5. mod_billing MODULE_NOT_IN_PLAN possible.
6. Preview is not a legal substitute for PDF.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/invoice-settings` | Bearer | UNAUTHORIZED, MODULE_NOT_IN_PLAN |
| PATCH | `/api/v1/pharmacy/invoice-settings` | Bearer owner | VALIDATION_ERROR, FORBIDDEN, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given GET settings, when loaded, then fields filled.
2. **AC-002**: Given PATCH, when valid, then saved.
3. **AC-003**: Given VALIDATION_ERROR, when GSTIN, then field error.
4. **AC-004**: Given staff 403, when patch, then read-only.
5. **AC-005**: Given MODULE_NOT_IN_PLAN, when GET, then lock.
6. **AC-006**: Given dirty, when leave, then confirm.
7. **AC-007**: Given a11y, when form, then labels.
8. **AC-008**: Given settings screen, when inspecting, then no einvoice IRN API calls.

## Test requirements

- Unit: Patch settings
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: No einvoice call
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-007 STORY-002/004

**Implemented Core references**

- EPIC-007 STORY-002

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
