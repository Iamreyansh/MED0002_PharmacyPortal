# EPIC-P008: Catalogue Search and Mapping

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P008` |
| Phase | 2 |
| Priority | P0 |
| Status | staging-deployed |
| Primary repository | `MED0003` |
| Primary owner | `mfe-catalogue` |
| Story count | 2 |

## Overview

Pharmacy-scoped medicine search and catalogue mapping CRUD.

## Goals

- Find master SKUs
- Map to pharmacy products

## Scope

### In scope

- /catalogue
- /catalogue/mapping

### Out of scope

- Admin master catalogue editing

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P008-001](./STORY-P008-001-catalogue-search.md) | Pharmacy catalogue search | MED0003 | mfe-catalogue | FREE+ | P0 | M | staging-deployed |
| [STORY-P008-002](./STORY-P008-002-catalogue-mapping-crud.md) | Catalogue mapping list and CRUD | MED0003 | mfe-catalogue | FREE+ | P0 | M | staging-deployed |

## Dependencies

- Core EPIC-005 STORY-003/005

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
