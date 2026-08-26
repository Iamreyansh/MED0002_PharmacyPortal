# STORY-P004-004: KYC document upload, list, delete, submit

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P004-004` |
| Epic | [EPIC-P004](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-onboarding` |
| Minimum plan | `FREE+` |

## Overview

Owner multipart upload, list, delete uploaded/rejected docs, submit packet. Staff may list only.

**Business value:** Admin HQ can review a complete KYC pack.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/onboarding/kyc`

**Screens / states**

- KYC list
- Upload
- Submit confirm

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- POST documents multipart
- GET list
- DELETE
- POST submit

### Out of scope

- Presigned S3 UI unless Core switches this endpoint; currently multipart

## Business rules

1. Owner-only write/submit; staff read list.
2. Delete only when Core allows (UPLOADED/REJECTED).
3. Submit when required types are present — disable using list payload, still handle Core 400.
4. No auto-KYC story.
5. Show document type + status; do not preview Rx/PII in logs.
6. Max size: show Core error if exceeded.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/pharmacy/kyc/documents` | Bearer owner multipart | VALIDATION_ERROR, UNSUPPORTED_MEDIA_TYPE |
| GET | `/api/v1/pharmacy/kyc/documents` | Bearer | UNAUTHORIZED |
| DELETE | `/api/v1/pharmacy/kyc/documents/{documentId}` | Bearer owner | FORBIDDEN, DOCUMENT_NOT_FOUND |
| POST | `/api/v1/pharmacy/kyc/submit` | Bearer owner | VALIDATION_ERROR, FORBIDDEN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given owner, when uploading a valid file, then POST documents succeeds and the list refreshes.
2. **AC-002**: Given staff, when visiting KYC write, then upload is hidden and GET still works.
3. **AC-003**: Given UPLOADED doc, when delete, then DELETE is called.
4. **AC-004**: Given complete pack, when submit, then POST submit runs and status route shows KYC_SUBMITTED.
5. **AC-005**: Given incomplete, when Core rejects submit, then missing types from error.details are listed.
6. **AC-006**: Given large file, when Core errors, then the message is shown.
7. **AC-007**: Given a11y, when file input, then it has an associated label.
8. **AC-008**: Given VERIFIED docs, when delete attempted, then Core error is shown if disallowed.

## Test requirements

- Unit: KYC list statuses
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Owner submit happy path mock
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- EPIC-P003
- Core EPIC-003

**Implemented Core references**

- EPIC-003 STORY-002

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
