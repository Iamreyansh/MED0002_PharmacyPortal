# EPIC-P004: Registration and KYC

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P004` |
| Phase | 1 |
| Priority | P0 |
| Status | Draft |
| Primary repository | `MED0003` |
| Primary owner | `mfe-onboarding` |
| Story count | 4 |

## Overview

Self-register pharmacy, verify email OTP, track registration status, upload KYC documents, submit for admin review.

## Goals

- Create account
- Email verify
- KYC packet
- Wait for ACTIVE

## Scope

### In scope

- /register
- /register/verify
- /onboarding/status
- /onboarding/kyc

### Out of scope

- Admin approve APIs
- Auto-KYC (removed in Core)
- DigiLocker unless used by Core pharmacy KYC multipart

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P004-001](./STORY-P004-001-register.md) | Pharmacy self-registration | MED0003 | mfe-onboarding | FREE+ | P0 | M | pending |
| [STORY-P004-002](./STORY-P004-002-verify-email-otp.md) | Registration email OTP verify and resend | MED0003 | mfe-onboarding | FREE+ | P0 | M | pending |
| [STORY-P004-003](./STORY-P004-003-registration-status.md) | Registration status gate | MED0003 | mfe-onboarding | FREE+ | P0 | M | pending |
| [STORY-P004-004](./STORY-P004-004-kyc-documents-submit.md) | KYC document upload, list, delete, submit | MED0003 | mfe-onboarding | FREE+ | P0 | M | pending |

## Dependencies

- EPIC-P003
- Core EPIC-003

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
