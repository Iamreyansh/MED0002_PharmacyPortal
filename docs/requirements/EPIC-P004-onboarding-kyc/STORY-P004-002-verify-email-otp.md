# STORY-P004-002: Registration email OTP verify and resend

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P004-002` |
| Epic | [EPIC-P004](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-onboarding` |
| Minimum plan | `FREE+` |

## Overview

POST verify-email and resend-otp. Rate limits from Core.

**Business value:** Proves the owner mailbox before KYC.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/register/verify`

**Screens / states**

- OTP verify

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- OTP input
- Resend cooldown UI if Core/retry_after provided

### Out of scope

- SMS OTP unless Core adds it to these endpoints

## Business rules

1. OTP length/charset per Core DTO.
2. Resend uses resend-otp endpoint only.
3. Too many requests → 429 / retry_after_seconds.
4. On success, if tokens are returned, host stores them; else prompt login.
5. Do not log OTP.
6. Expired OTP uses Core code.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/pharmacy/register/verify-email` | public | VALIDATION_ERROR, INVALID_OTP, OTP_EXPIRED |
| POST | `/api/v1/pharmacy/register/resend-otp` | public | VALIDATION_ERROR, RATE_LIMIT_EXCEEDED, RESEND_LIMIT_EXCEEDED, RESEND_TOO_SOON |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given correct OTP, when verify succeeds, then user proceeds to onboarding status or login as Core indicates.
2. **AC-002**: Given wrong OTP, when INVALID_OTP, then input refocuses.
3. **AC-003**: Given resend, when clicked, then resend-otp is called.
4. **AC-004**: Given 429, when resend, then wait time is shown.
5. **AC-005**: Given expired, when OTP_EXPIRED, then resend is offered.
6. **AC-006**: Given paste 6 digits, when supported, then the hidden input accepts it.
7. **AC-007**: Given a11y, when OTP, then it has a label.
8. **AC-008**: Given success tokens, when present, then host session is set.

## Test requirements

- Unit: OTP errors
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Verify success routing
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- EPIC-P003
- Core EPIC-003

**Implemented Core references**

- EPIC-003 STORY-001

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
