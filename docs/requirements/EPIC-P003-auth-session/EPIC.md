# EPIC-P003: Authentication, Session, and POS PIN

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P003` |
| Phase | 1 |
| Priority | P0 |
| Status | staging-deployed |
| Primary repository | `MED0002` |
| Primary owner | `mfe-auth` |
| Story count | 6 |

## Overview

Pharmacy login, POS PIN, switch-pharmacy, sessions, logout, and route guards. Host stores tokens; auth MFE owns forms.

## Goals

- Credential login
- PIN POS mode
- Multi-pharmacy switch
- Session revoke

## Scope

### In scope

- /login
- /pos-login
- /sessions
- guards

### Out of scope

- Customer OTP
- Admin MFA
- Staff invite

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P003-001](./STORY-P003-001-pharmacy-login.md) | Pharmacy staff login | MED0002 | mfe-auth | FREE+ | P0 | M | staging-deployed |
| [STORY-P003-002](./STORY-P003-002-logout-refresh-me.md) | Logout, logout-all, and session bootstrap | MED0002 | mfe-auth | FREE+ | P0 | M | staging-deployed |
| [STORY-P003-003](./STORY-P003-003-sessions-revoke.md) | Active sessions list and revoke | MED0002 | mfe-auth | FREE+ | P0 | M | staging-deployed |
| [STORY-P003-004](./STORY-P003-004-switch-pharmacy.md) | Multi-pharmacy context switch | MED0002 | host | FREE+ | P0 | M | staging-deployed |
| [STORY-P003-005](./STORY-P003-005-pos-pin-shell.md) | POS PIN login and POS-scoped shell | MED0002 | mfe-auth | FREE+ | P0 | M | staging-deployed |
| [STORY-P003-006](./STORY-P003-006-route-guards.md) | Route guards and onboarding gate | MED0002 | host | FREE+ | P0 | M | staging-deployed |

## Dependencies

- EPIC-P002
- Core EPIC-001 STORY-002/004

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
