# EPIC-P019: Support Tickets and Help Centre

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P019` |
| Phase | 3 |
| Priority | P1 |
| Status | Draft |
| Primary repository | `MED0003` |
| Primary owner | `mfe-support` |
| Story count | 3 |

## Overview

Create and continue pharmacy support tickets by id, plus public help and deflection. No ticket inbox or pharmacy dispute API.

## Goals

- Raise pharmacy tickets
- Resolve common questions through public help

## Scope

### In scope

- /support/new
- /support/tickets/:id
- /help

### Out of scope

- Inbox
- Pharmacy dispute creation
- Agent console
- Admin mutations

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P019-001](./STORY-P019-001-ticket-create-detail.md) | Create support ticket and view by id | MED0003 | mfe-support | FREE+ | P0 | M | pending |
| [STORY-P019-002](./STORY-P019-002-ticket-reply-csat-reopen.md) | Ticket reply, CSAT, reopen | MED0003 | mfe-support | FREE+ | P0 | M | pending |
| [STORY-P019-004](./STORY-P019-004-help-centre.md) | Public help centre and deflection | MED0003 | mfe-support | FREE+ | P0 | M | pending |

## Dependencies

- Core EPIC-015 STORY-001/002

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
