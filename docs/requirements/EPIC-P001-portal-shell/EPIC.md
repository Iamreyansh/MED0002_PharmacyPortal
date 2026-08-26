# EPIC-P001: Portal Shell and Navigation

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P001` |
| Phase | 1 |
| Priority | P0 |
| Status | Draft |
| Primary repository | `MED0002` |
| Primary owner | `host` |
| Story count | 4 |

## Overview

Replace the Todo-demo host with a production pharmacy shell: chrome, remote registry, permission/plan-aware navigation, and degraded MFE behaviour.

## Goals

- Load domain remotes by manifest URL through RemoteLoader and MfeDataEnvelope 1.0.0.
- Render IA groups Counter / Stock / Fulfilment / Money / Settings from PERSONAS and IA docs.
- Fail a single remote without taking down the host.
- Keep Todo out of product navigation.

## Scope

### In scope

- App chrome
- Remote registry
- Nav rules
- Error boundaries
- Home shortcuts

### Out of scope

- Domain screens
- Auth API calls (EPIC-P003)
- Real API client (EPIC-P002)

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P001-001](./STORY-P001-001-app-chrome-home.md) | App chrome and home shortcuts | MED0002 | host | FREE+ | P0 | M | pending |
| [STORY-P001-002](./STORY-P001-002-permission-plan-nav.md) | Permission- and plan-aware navigation | MED0002 | host | FREE+ | P0 | M | pending |
| [STORY-P001-003](./STORY-P001-003-remote-loader-degraded.md) | Remote loading and degraded MFE behaviour | MED0002 | host | FREE+ | P0 | M | pending |
| [STORY-P001-004](./STORY-P001-004-retire-todo-product-nav.md) | Retire Todo from product navigation | MED0002 | host | FREE+ | P0 | M | pending |

## Dependencies

- MED0003 contracts
- INFORMATION-ARCHITECTURE.md

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
