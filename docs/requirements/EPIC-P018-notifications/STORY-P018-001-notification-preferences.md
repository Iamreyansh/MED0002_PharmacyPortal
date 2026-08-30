# STORY-P018-001: Notification preferences

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P018-001` |
| Epic | [EPIC-P018](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-settings` |
| Minimum plan | `FREE+` |

## Overview

GET/PATCH /pharmacy/notification-preferences. Only channels Core returns.

**Business value:** Owners stop noise they did not ask for.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/settings/notifications`

**Screens / states**

- Preferences

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Toggles per payload

### Out of scope

- Inbox
- WhatsApp row if absent

## Business rules

1. Do not add WhatsApp if payload lacks it.
2. PATCH is owner-only and sends the snake_case subset; staff may read their effective preferences.
3. Success toast.
4. Unsaved confirm.
5. No fake digest emails.
6. Follow GET scoping for staff vs pharmacy.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/notification-preferences` | Bearer owner\|staff | UNAUTHORIZED |
| PATCH | `/api/v1/pharmacy/notification-preferences` | Bearer owner | VALIDATION_ERROR, FORBIDDEN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given preferences from Core, when the page loads, then every returned channel key has a matching toggle.
2. **AC-002**: Given an owner changes supported preferences, when PATCH succeeds, then the GET representation refreshes.
3. **AC-003**: Given WhatsApp is absent from the response, when the form renders, then no WhatsApp row is invented.
4. **AC-004**: Given Core returns VALIDATION_ERROR, when Save fails, then returned field details are displayed.
5. **AC-005**: Given unsaved changes, when the actor leaves, then confirmation prevents accidental loss.
6. **AC-006**: Given pharmacy staff can read preferences, when GET succeeds, then preferences are read-only and accessible.

## Test requirements

- Unit: No invented channels
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Patch
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-017 STORY-001/005

**Implemented Core references**

- EPIC-017 STORY-005

**Shared portal requirements**

- `PRODUCT-IDEOLOGY.md`
- `PERSONAS-RBAC-PLAN-MATRIX.md`
- `API-INTEGRATION-CONTRACT.md`
- `DOMAIN-STATE-MACHINES.md`
- `ERROR-AND-RECOVERY-CATALOG.md`
- `UX-ACCESSIBILITY-STANDARDS.md`
- `NON-FUNCTIONAL-REQUIREMENTS.md`

## Notes

- No additional implementation notes.
