# EPIC-P012: GST Invoices and Sales Ledger

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P012` |
| Phase | 2 |
| Priority | P0 |
| Status | staging-deployed |
| Primary repository | `MED0003` |
| Primary owner | `mfe-billing` |
| Story count | 4 |

## Overview

Invoices list/detail/pdf/share, invoice settings, sales ledger/summary/mark-paid.

## Goals

- GST invoice after POS
- Sales register

## Scope

### In scope

- /invoices
- /invoice-settings
- /sales

### Out of scope

- GSTR-8 filing UI

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P012-001](./STORY-P012-001-invoices-pdf-share.md) | Invoice list, detail, PDF, share | MED0003 | mfe-billing | FREE+ | P0 | M | staging-deployed |
| [STORY-P012-002](./STORY-P012-002-invoice-settings.md) | Invoice settings | MED0003 | mfe-billing | FREE+ | P0 | M | staging-deployed |
| [STORY-P012-003](./STORY-P012-003-sales-ledger.md) | Sales ledger, summary, export | MED0003 | mfe-billing | FREE+ | P0 | M | staging-deployed |
| [STORY-P012-004](./STORY-P012-004-sales-mark-paid.md) | Mark sale paid | MED0003 | mfe-billing | FREE+ | P0 | M | staging-deployed |

## Dependencies

- Core EPIC-007 STORY-002/004

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
