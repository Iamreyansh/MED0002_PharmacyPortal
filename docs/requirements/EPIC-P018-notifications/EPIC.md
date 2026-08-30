# EPIC-P018: Notification Preferences and Device Tokens

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P018` |
| Phase | 3 |
| Priority | P1 |
| Status | staging-deployed |
| Primary repository | `MED0003` |
| Primary owner | `mfe-settings` |
| Story count | 2 |

## Overview

Preferences + device token. No pharmacy in-app inbox.

## Goals

- Opt-in Core channels
- Register browser token

## Scope

### In scope

- /settings/notifications

### Out of scope

- Inbox
- WhatsApp/email if not in Core payload

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P018-001](./STORY-P018-001-notification-preferences.md) | Notification preferences | MED0003 | mfe-settings | FREE+ | P0 | M | staging-deployed |
| [STORY-P018-002](./STORY-P018-002-device-token.md) | Browser/device token register and unregister | MED0002 | host | FREE+ | P0 | M | staging-deployed |

## Dependencies

- Core EPIC-017 STORY-001/005

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
