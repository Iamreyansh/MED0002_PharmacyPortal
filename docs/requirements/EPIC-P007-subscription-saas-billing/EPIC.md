# EPIC-P007: Plans, Subscription, and SaaS Billing

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P007` |
| Phase | 1 |
| Priority | P0 |
| Status | Draft |
| Primary repository | `MED0003` |
| Primary owner | `mfe-subscription` |
| Story count | 4 |

## Overview

Pharmacy-facing plan catalogue, subscribe/upgrade/downgrade/cancel/auto-renew, SaaS invoices and Cashfree pay handoff. Display labels Free/Starter/Growth/Pro; enums FREE/STARTER/RETAIL_PRO/ENTERPRISE.

## Goals

- Honest plan matrix
- Cashfree checkout without secrets
- Lock screens reuse this epic

## Scope

### In scope

- /subscription
- /billing

### Out of scope

- Admin CRM plans CRUD
- Webhooks
- Add-on marketplace if pharmacy APIs are admin-only

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P007-001](./STORY-P007-001-plan-catalogue.md) | Plan catalogue with display labels | MED0003 | mfe-subscription | FREE+ | P0 | M | pending |
| [STORY-P007-002](./STORY-P007-002-subscribe-change-cancel.md) | Subscribe, upgrade, downgrade, cancel, auto-renew | MED0003 | mfe-subscription | FREE+ | P0 | M | pending |
| [STORY-P007-003](./STORY-P007-003-saas-invoices-cashfree.md) | SaaS invoices and Cashfree pay handoff | MED0003 | mfe-subscription | FREE+ | P0 | M | pending |
| [STORY-P007-004](./STORY-P007-004-plan-lock-ux.md) | Global plan-lock and upgrade prompt | MED0002 | host | FREE+ | P0 | M | pending |

## Dependencies

- Core EPIC-014
- Cashfree pg checkout fields from pay response

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
