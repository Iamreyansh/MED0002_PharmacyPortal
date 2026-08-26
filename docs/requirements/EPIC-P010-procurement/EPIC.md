# EPIC-P010: Purchases, Distributors, and Reorder

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P010` |
| Phase | 2 |
| Priority | P0 |
| Status | Draft |
| Primary repository | `MED0003` |
| Primary owner | `mfe-procurement` |
| Story count | 4 |

## Overview

GRN lifecycle and CSV import (Free+). Distributors and reorder/PO (Growth+).

## Goals

- Stock in via GRN
- Supplier directory
- PO loop

## Scope

### In scope

- /purchases
- /distributors
- /reorder

### Out of scope

- Manufacturer portals

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P010-001](./STORY-P010-001-grn-lifecycle.md) | Purchase GRN create, items, save-and-stock | MED0003 | mfe-procurement | FREE+ | P0 | M | pending |
| [STORY-P010-002](./STORY-P010-002-grn-csv-import.md) | GRN CSV import and confirm | MED0003 | mfe-procurement | FREE+ | P0 | M | pending |
| [STORY-P010-003](./STORY-P010-003-distributors.md) | Distributor directory and price compare (Growth+) | MED0003 | mfe-procurement | RETAIL_PRO+ | P0 | M | pending |
| [STORY-P010-004](./STORY-P010-004-reorder-purchase-orders.md) | Reorder suggestions and purchase orders (Growth+) | MED0003 | mfe-procurement | RETAIL_PRO+ | P0 | M | pending |

## Dependencies

- Core EPIC-006 STORY-004-006

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
