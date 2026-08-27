# STORY-P005-002: Completeness, tax, bank account, contact verify

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P005-002` |
| Epic | [EPIC-P005](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-settings` |
| Minimum plan | `FREE+` |

## Overview

Completeness meter, tax PATCH, bank GET/POST, contact verify POST. Bank uses Core/Cashfree penny-drop — portal shows Core status only.

**Business value:** Settlements and GST invoices have legal identity.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/settings/profile`

**Screens / states**

- Completeness
- Tax
- Bank
- Verify contact

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Completeness widget
- Tax fields
- Bank form
- Contact OTP/verify as Core DTO

### Out of scope

- Direct Cashfree secret calls
- Penny-drop UI beyond Core response

## Business rules

1. GET completeness drives checklist links.
2. Tax PATCH owner-only.
3. Bank POST owner-only; GET may mask numbers.
4. Contact verify owner-only.
5. Do not store full account numbers in telemetry.
6. Failure codes from Core (e.g. invalid IFSC) map to fields.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/profile/completeness` | Bearer | UNAUTHORIZED |
| PATCH | `/api/v1/pharmacy/profile/tax` | Bearer owner | FORBIDDEN, VALIDATION_ERROR |
| GET | `/api/v1/pharmacy/profile/bank-account` | Bearer owner | FORBIDDEN |
| POST | `/api/v1/pharmacy/profile/bank-account` | Bearer owner | VALIDATION_ERROR, FORBIDDEN |
| POST | `/api/v1/pharmacy/profile/verify-contact` | Bearer owner | VALIDATION_ERROR, FORBIDDEN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given completeness payload, when rendered, then missing items link to the matching form section.
2. **AC-002**: Given owner tax PATCH, when valid GSTIN as Core accepts, then success.
3. **AC-003**: Given bank GET, when masked account returned, then UI does not invent digits.
4. **AC-004**: Given bank POST fail, when error.code present, then shown.
5. **AC-005**: Given staff, when bank section, then hidden or 403 handled.
6. **AC-006**: Given verify-contact, when Core requires OTP payload, then the form matches DTO only.
7. **AC-007**: Given completeness 0, when KYC still pending, then both checklists visible not duplicated incorrectly.
8. **AC-008**: Given a11y, when checklist, then it is a list with names.

## Test requirements

- Unit: Completeness mapping
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Bank owner-only
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- EPIC-P003
- Core EPIC-003 STORY-005
- EPIC-004 STORY-004

**Implemented Core references**

- EPIC-003 STORY-005

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
