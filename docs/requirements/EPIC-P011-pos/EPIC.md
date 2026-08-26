# EPIC-P011: Point of Sale

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P011` |
| Phase | 2 |
| Priority | P0 |
| Status | Draft |
| Primary repository | `MED0003` |
| Primary owner | `mfe-pos` |
| Story count | 4 |

## Overview

Counter cart, search, customer attach, discount, FEFO checkout. Works with full token and pos-scoped token.

## Goals

- Sell without leaving the keypad
- FEFO decrement via Core checkout

## Scope

### In scope

- /pos

### Out of scope

- Offline sales
- WhatsApp share unless invoice share exists in P012

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P011-001](./STORY-P011-001-pos-cart.md) | POS cart create, get, items, clear | MED0003 | mfe-pos | FREE+ | P0 | M | pending |
| [STORY-P011-002](./STORY-P011-002-pos-search-customer-discount.md) | POS search, attach customer, apply discount | MED0003 | mfe-pos | FREE+ | P0 | M | pending |
| [STORY-P011-003](./STORY-P011-003-pos-checkout.md) | POS checkout with FEFO and payments | MED0003 | mfe-pos | FREE+ | P0 | M | pending |
| [STORY-P011-004](./STORY-P011-004-pos-shell-scope.md) | POS MFE under pos-scoped token | MED0002 | mfe-pos | FREE+ | P0 | M | pending |

## Dependencies

- Core EPIC-007 STORY-001
- EPIC-P003-005

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
