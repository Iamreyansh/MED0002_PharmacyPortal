# EPIC-P016: Marketplace Settlements

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P016` |
| Phase | 3 |
| Priority | P1 |
| Status | staging-deployed |
| Primary repository | `MED0003` |
| Primary owner | `mfe-finance` |
| Story count | 2 |

## Overview

Owner-only settlement history and detail.

## Goals

- Payout transparency from Core fields

## Scope

### In scope

- /finance/settlements

### Out of scope

- Commission admin
- Triggering payouts

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P016-001](./STORY-P016-001-settlement-list.md) | Settlement history list | MED0003 | mfe-finance | FREE+ | P0 | M | staging-deployed |
| [STORY-P016-002](./STORY-P016-002-settlement-detail.md) | Settlement detail | MED0003 | mfe-finance | FREE+ | P0 | M | staging-deployed |

## Dependencies

- Core EPIC-012 STORY-003

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
