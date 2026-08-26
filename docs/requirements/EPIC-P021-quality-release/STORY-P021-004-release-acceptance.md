# STORY-P021-004: Release acceptance checklist

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P021-004` |
| Epic | [EPIC-P021](./EPIC.md) |
| Phase | 4 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0002` |
| Screen owner | `host` |
| Minimum plan | `FREE+` |

## Overview

Release is acceptable when product nav has no Todo, api.request is not 501, auth works, plan labels map, exclusions remain excluded.

**Business value:** Ship the console, not the demo.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `*`

**Screens / states**

- N/A

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Checklist + CI assertions

### Out of scope

- Declaring Core production-ready

## Business rules

1. This corpus never claims Core production-ready.
2. Minimum ship: P001–P003 + P011 plus locks for the rest.
3. Smoke script must not require Todo.
4. Tracker stays pending until implementation.
5. Registry product remotes match IA.
6. Exclusions: no inbox, staff invite, IPD, kiosk, notification inbox.

## API endpoints

No Core endpoint is introduced or called by this story.

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given production deploy, when home, then pharmacy chrome not Todo.
2. **AC-002**: Given envelope, when api.request, then not hard-coded 501.
3. **AC-003**: Given login, when API base set, then Core auth reachable.
4. **AC-004**: Given RETAIL_PRO, when copy, then Growth.
5. **AC-005**: Given QA, when exclusions, then no order inbox, staff invite, IPD, kiosk, notification inbox.
6. **AC-006**: Given smoke script, when run, then exit 0 on host.
7. **AC-007**: Given remotes.registry production, when listed, then product remotes only.
8. **AC-008**: Given this corpus commit, when tracker, then all pending.

## Test requirements

- CI smoke + checklist test

## Dependencies and references

**Epic dependencies**

- Prior epics as they land

**Implemented Core references**

- n/a

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
