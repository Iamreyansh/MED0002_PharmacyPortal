# EPIC-P021: Cross-domain Quality and Release Acceptance

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P021` |
| Phase | 4 |
| Priority | P0 |
| Status | staging-deployed |
| Primary repository | `MED0002` |
| Primary owner | `host` |
| Story count | 4 |

## Overview

E2E, a11y/security/perf, failure recovery, release checklist.

## Goals

- Ship console not demo
- Critical journeys green

## Scope

### In scope

- Playwright
- axe
- NFR

### Out of scope

- New product features

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P021-001](./STORY-P021-001-e2e-journeys.md) | End-to-end pharmacy journeys | MED0002 | host | FREE+ | P0 | M | staging-deployed |
| [STORY-P021-002](./STORY-P021-002-a11y-security-perf.md) | Accessibility, security, and performance acceptance | MED0002 | host | FREE+ | P0 | M | staging-deployed |
| [STORY-P021-003](./STORY-P021-003-failure-recovery.md) | Failure recovery drills | MED0002 | host | FREE+ | P0 | M | staging-deployed |
| [STORY-P021-004](./STORY-P021-004-release-acceptance.md) | Release acceptance checklist | MED0002 | host | FREE+ | P0 | M | staging-deployed |

## Dependencies

- Prior epics as they land

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
