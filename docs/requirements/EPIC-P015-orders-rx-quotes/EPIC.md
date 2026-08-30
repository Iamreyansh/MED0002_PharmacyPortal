# EPIC-P015: Rx Quotes and Order Lifecycle Actions

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P015` |
| Phase | 3 |
| Priority | P0 |
| Status | staging-deployed |
| Primary repository | `MED0003` |
| Primary owner | `mfe-orders` |
| Story count | 4 |

## Overview

Rx quotes are listable. Online orders are id-in-hand mutations only — no GET list/detail.

## Goals

- Quote uploaded Rx
- Act on known order ids

## Scope

### In scope

- /rx-quotes
- /orders/:orderId

### Out of scope

- Order inbox
- Order detail GET
- Kanban
- Rider directory

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P015-001](./STORY-P015-001-rx-quotes-queue.md) | Rx quote list, quote, decline | MED0003 | mfe-orders | FREE+ | P0 | M | staging-deployed |
| [STORY-P015-002](./STORY-P015-002-order-accept-reject.md) | Order accept and reject by id (no inbox) | MED0003 | mfe-orders | FREE+ | P0 | M | staging-deployed |
| [STORY-P015-003](./STORY-P015-003-order-status-advance.md) | Advance order packing status by id | MED0003 | mfe-orders | FREE+ | P0 | M | staging-deployed |
| [STORY-P015-004](./STORY-P015-004-order-assign-rider.md) | Assign rider by order id | MED0003 | mfe-orders | FREE+ | P0 | M | staging-deployed |

## Dependencies

- Core EPIC-010 STORY-003
- PharmacyOrderLifecycleController

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
