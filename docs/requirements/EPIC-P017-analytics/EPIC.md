# EPIC-P017: Pharmacy Analytics and Reports

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P017` |
| Phase | 3 |
| Priority | P1 |
| Status | staging-deployed |
| Primary repository | `MED0003` |
| Primary owner | `mfe-analytics` |
| Story count | 3 |

## Overview

Growth+ analytics. Owner-only GST/accounts and favorites.

## Goals

- Sales insight
- GST accounts view

## Scope

### In scope

- /analytics

### Out of scope

- Admin impersonation analytics

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P017-001](./STORY-P017-001-analytics-overview.md) | Analytics overview (Growth+) | MED0003 | mfe-analytics | RETAIL_PRO+ | P0 | M | staging-deployed |
| [STORY-P017-002](./STORY-P017-002-analytics-sales-products.md) | Sales register and products analytics | MED0003 | mfe-analytics | RETAIL_PRO+ | P0 | M | staging-deployed |
| [STORY-P017-003](./STORY-P017-003-analytics-gst-reports.md) | GST accounts and report catalogue favorites (owner) | MED0003 | mfe-analytics | RETAIL_PRO+ | P0 | M | staging-deployed |

## Dependencies

- Core EPIC-016 STORY-004

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
