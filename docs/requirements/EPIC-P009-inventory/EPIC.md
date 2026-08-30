# EPIC-P009: Inventory, Batches, and Racks

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P009` |
| Phase | 2 |
| Priority | P0 |
| Status | staging-deployed |
| Primary repository | `MED0003` |
| Primary owner | `mfe-inventory` |
| Story count | 4 |

## Overview

Stock master, FEFO batches, expiry, write-off, racks, labels, online visibility Growth+.

## Goals

- Counter can find stock
- FEFO discipline
- Expiry risk

## Scope

### In scope

- /inventory
- /inventory/:id
- /inventory/expiry
- /racks

### Out of scope

- Distributor (P010)
- GRN (P010)

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P009-001](./STORY-P009-001-inventory-master.md) | Inventory list, summary, detail, and product patch | MED0003 | mfe-inventory | FREE+ | P0 | M | staging-deployed |
| [STORY-P009-002](./STORY-P009-002-batches-expiry-writeoff.md) | Batches, FEFO, expiry alerts, write-off | MED0003 | mfe-inventory | FREE+ | P0 | M | staging-deployed |
| [STORY-P009-003](./STORY-P009-003-rack-locations.md) | Rack locations, assign, print labels | MED0003 | mfe-inventory | FREE+ | P0 | M | staging-deployed |
| [STORY-P009-004](./STORY-P009-004-online-visibility.md) | Online visibility toggle (Growth+) | MED0003 | mfe-inventory | RETAIL_PRO+ | P0 | M | staging-deployed |

## Dependencies

- Core EPIC-006 STORY-001-003

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
