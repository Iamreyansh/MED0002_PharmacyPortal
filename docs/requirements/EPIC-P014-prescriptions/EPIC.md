# EPIC-P014: Prescription Queue and Drug Register

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P014` |
| Phase | 3 |
| Priority | P0 |
| Status | staging-deployed |
| Primary repository | `MED0003` |
| Primary owner | `mfe-rx` |
| Story count | 4 |

## Overview

Starter+ Rx queue and H1/X drug register.

## Goals

- Legal dispense
- Hand-off to POS

## Scope

### In scope

- /prescriptions
- /compliance/drug-register

### Out of scope

- Doctor teleconsult UI
- OCR as a live promise

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P014-001](./STORY-P014-001-rx-queue-list-detail.md) | Rx queue list and detail (Starter+) | MED0003 | mfe-rx | STARTER+ | P0 | M | staging-deployed |
| [STORY-P014-002](./STORY-P014-002-rx-approve-reject.md) | Approve and reject prescriptions | MED0003 | mfe-rx | STARTER+ | P0 | M | staging-deployed |
| [STORY-P014-003](./STORY-P014-003-rx-dispense.md) | Dispense and dispense-to-billing | MED0003 | mfe-rx | STARTER+ | P0 | M | staging-deployed |
| [STORY-P014-004](./STORY-P014-004-drug-register.md) | Schedule H1/X drug register | MED0003 | mfe-rx | FREE+ | P0 | M | staging-deployed |

## Dependencies

- Core EPIC-008 STORY-002/004

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
