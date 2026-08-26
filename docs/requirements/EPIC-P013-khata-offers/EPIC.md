# EPIC-P013: Khata Credit and Pharmacy Offers

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P013` |
| Phase | 2 |
| Priority | P1 |
| Status | Draft |
| Primary repository | `MED0003` |
| Primary owner | `mfe-billing` |
| Story count | 3 |

## Overview

Starter+ khata. Growth+ offers.

## Goals

- Credit book
- Local discounts

## Scope

### In scope

- /khata
- /offers

### Out of scope

- Platform coupons

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P013-001](./STORY-P013-001-khata-list-detail.md) | Khata list, detail, payment history (Starter+) | MED0003 | mfe-billing | STARTER+ | P0 | M | pending |
| [STORY-P013-002](./STORY-P013-002-khata-repay-remind.md) | Khata repayment and reminders | MED0003 | mfe-billing | STARTER+ | P0 | M | pending |
| [STORY-P013-003](./STORY-P013-003-offers-crud-validate.md) | Pharmacy offers CRUD and validate (Growth+) | MED0003 | mfe-billing | RETAIL_PRO+ | P0 | M | pending |

## Dependencies

- Core EPIC-007 STORY-003/005

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
