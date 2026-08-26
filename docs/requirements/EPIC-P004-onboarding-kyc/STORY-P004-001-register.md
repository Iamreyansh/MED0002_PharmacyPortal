# STORY-P004-001: Pharmacy self-registration

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P004-001` |
| Epic | [EPIC-P004](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-onboarding` |
| Minimum plan | `FREE+` |

## Overview

Public POST /pharmacy/register collects legal/shop fields Core requires, then sends the user to email verify.

**Business value:** A chemist can start Free without a sales call.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/register`

**Screens / states**

- Register

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Register form bound to Core DTO

### Out of scope

- Payment at register
- Hospital/IPD fields

## Business rules

1. Request body fields must match Core PharmacyRegistrationController DTO — no extra legal fields.
2. Success continues to `/register/verify` with email from response or form.
3. Duplicate email/phone uses Core error codes.
4. Do not set plan other than default FREE Core assigns.
5. Password rules match Core (same as staff password policy if returned as VALIDATION_ERROR).
6. Public endpoint: no Bearer.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| POST | `/api/v1/pharmacy/register` | public | VALIDATION_ERROR, EMAIL_ALREADY_REGISTERED, PHONE_ALREADY_REGISTERED, DRUG_LICENCE_ALREADY_REGISTERED, GSTIN_ALREADY_REGISTERED, PAN_ALREADY_REGISTERED |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given valid payload, when POST register succeeds, then user is on verify with email shown.
2. **AC-002**: Given missing required field, when submit, then VALIDATION_ERROR maps to fields.
3. **AC-003**: Given duplicate, when Core conflicts, then the form explains using error.message.
4. **AC-004**: Given success, when user refreshes verify, then they can resend OTP (next story).
5. **AC-005**: Given authenticated user, when visiting register, then redirect home/onboarding.
6. **AC-006**: Given keyboard, when submitting, then first error receives focus.
7. **AC-007**: Given network fail, when retry, then the same form values remain.
8. **AC-008**: Given copy, when describing plan, then Free is the default display label.

## Test requirements

- Unit: Register validation
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Register → verify route
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
