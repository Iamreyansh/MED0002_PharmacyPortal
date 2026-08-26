# STORY-P012-001: Invoice list, detail, PDF, share

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P012-001` |
| Epic | [EPIC-P012](./EPIC.md) |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-billing` |
| Minimum plan | `FREE+` |

## Overview

GET invoices, detail, pdf, POST share. Share channel is whatever Core implements.

**Business value:** Customer gets a GST invoice.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/invoices`
- `/invoices/:invoiceId`

**Screens / states**

- Invoices
- Invoice detail

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- List
- Detail
- PDF
- Share

### Out of scope

- HTML legal invoice substitute
- WhatsApp if Core does not support it

## Business rules

1. PDF uses Core content-type.
2. Share body follows DTO; unsupported channel → Core error.
3. Excel export if invoices/export-excel exists in Bruno.
4. Full token required (not POS).
5. Pagination/filters per Core.
6. Money formatted ₹ from payload.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/invoices` | Bearer full | UNAUTHORIZED, POS_TOKEN_RESTRICTED, MODULE_NOT_IN_PLAN |
| GET | `/api/v1/pharmacy/invoices/{invoiceId}` | Bearer full | INVOICE_NOT_FOUND, POS_TOKEN_RESTRICTED, MODULE_NOT_IN_PLAN |
| GET | `/api/v1/pharmacy/invoices/{invoiceId}/pdf` | Bearer full | INVOICE_NOT_FOUND, POS_TOKEN_RESTRICTED, MODULE_NOT_IN_PLAN |
| POST | `/api/v1/pharmacy/invoices/{invoiceId}/share` | Bearer full | VALIDATION_ERROR, POS_TOKEN_RESTRICTED, MODULE_NOT_IN_PLAN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given list GET, when loaded, then invoices paginate.
2. **AC-002**: Given detail, when id valid, then lines render.
3. **AC-003**: Given PDF, when GET, then file opens or downloads.
4. **AC-004**: Given share, when POST valid DTO, then success.
5. **AC-005**: Given 404, when bad id, then not-found.
6. **AC-006**: Given POS token, when this route, then Core returns POS_TOKEN_RESTRICTED and the host shows the scoped-access state.
7. **AC-007**: Given export-excel if present, when clicked, then download.
8. **AC-008**: Given empty, when none, then CTA POS.

## Test requirements

- Unit: PDF GET
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Share DTO
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
