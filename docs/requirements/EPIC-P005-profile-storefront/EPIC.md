# EPIC-P005: Pharmacy Profile and Storefront

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P005` |
| Phase | 1 |
| Priority | P0 |
| Status | staging-deployed |
| Primary repository | `MED0003` |
| Primary owner | `mfe-settings` |
| Story count | 3 |

## Overview

Profile, completeness, tax, bank (Cashfree penny-drop via Core), contact verify, storefront online/offline.

## Goals

- Editable shop identity
- Bank for settlements
- Storefront toggle with admin override

## Scope

### In scope

- /settings/profile
- /settings/storefront

### Out of scope

- Admin zone override UI

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P005-001](./STORY-P005-001-profile-get-patch.md) | View and edit pharmacy profile | MED0003 | mfe-settings | FREE+ | P0 | M | staging-deployed |
| [STORY-P005-002](./STORY-P005-002-profile-completeness-tax-bank-contact.md) | Completeness, tax, bank account, contact verify | MED0003 | mfe-settings | FREE+ | P0 | M | staging-deployed |
| [STORY-P005-003](./STORY-P005-003-storefront-toggle.md) | Storefront online/offline | MED0003 | mfe-settings | FREE+ | P0 | M | staging-deployed |

## Dependencies

- EPIC-P003
- Core EPIC-003 STORY-005
- EPIC-004 STORY-004

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
