# EPIC-P006: Roles and Permissions UI

| Attribute | Value |
| --- | --- |
| Epic ID | `EPIC-P006` |
| Phase | 1 |
| Priority | P1 |
| Status | Draft |
| Primary repository | `MED0003` |
| Primary owner | `mfe-settings` |
| Story count | 3 |

## Overview

List/create/delete custom roles and edit permissions. No staff user CRUD.

## Goals

- Custom role packs
- Permission editor

## Scope

### In scope

- /settings/roles

### Out of scope

- Invite staff
- Reset password
- Set POS PIN
- Deactivate user
- Seat-limit enforcement UI without an API

## Stories

| Story | Title | Repo | Owner | Plan | Priority | Size | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [STORY-P006-001](./STORY-P006-001-roles-list-create-delete.md) | Role catalogue create and delete | MED0003 | mfe-settings | FREE+ | P0 | M | pending |
| [STORY-P006-002](./STORY-P006-002-role-permissions-editor.md) | Role permission editor | MED0003 | mfe-settings | FREE+ | P0 | M | pending |
| [STORY-P006-003](./STORY-P006-003-permission-aware-ui-contract.md) | Document permission-aware UI contract for remotes | MED0002 | host | FREE+ | P0 | M | pending |

## Dependencies

- Core EPIC-001 STORY-005

## Completion conditions

- Every story acceptance criterion is covered by an automated unit, contract, integration, accessibility, or end-to-end check as specified by that story.
- Portal screens use only the cited Core endpoints and DTOs; contract drift is resolved in this corpus before implementation.
- Role, plan, pharmacy-status, and token-scope restrictions are enforced by Core and mirrored in the UI.
- Loading, empty, validation, locked, forbidden, stale, and recoverable error states follow the shared requirement documents.
- No new pharmacy-facing workflow is claimed complete while its required Core capability remains in `BACKEND-CAPABILITY-GAPS.md`.
