# EPIC-P002: Host API Client and Capabilities

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P002` |
| Phase | 1 |
| Priority | P0 |
| Status | staging-deployed |
| Primary repository | `MED0002` |
| Primary owner | `host` |
| Story count | 3 |

## Overview

Replace the 501 stub `capabilities.api.request` with a Core-compliant client: envelopes, JWT, refresh, idempotency, telemetry.

## Goals

- One API facade for all remotes
- Map errors to ERROR-AND-RECOVERY-CATALOG.md
- No secrets in remotes

## Scope

### In scope

- Fetch client
- Auth header
- Idempotency
- Refresh single-flight
- Telemetry hooks

### Out of scope

- Login UI (P003)
- Domain screens

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P002-001](./STORY-P002-001-api-request-facade.md) | Host API request facade | MED0002 | host | FREE+ | P0 | M | staging-deployed |
| [STORY-P002-002](./STORY-P002-002-auth-refresh-intercept.md) | JWT attach, refresh single-flight, and 401 recovery | MED0002 | host | FREE+ | P0 | M | staging-deployed |
| [STORY-P002-003](./STORY-P002-003-errors-idempotency-telemetry.md) | Error mapping, idempotency keys, retries, telemetry | MED0002 | host | FREE+ | P0 | M | staging-deployed |

## Dependencies

- API-INTEGRATION-CONTRACT.md
- EPIC-P001

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
