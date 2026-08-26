# STORY-P001-004: Retire Todo from product navigation

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P001-004` |
| Epic | [EPIC-P001](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0002` |
| Screen owner | `host` |
| Minimum plan | `FREE+` |

## Overview

Todo remote may remain as a non-prod federation smoke target. Production registry and nav must not advertise it.

**Business value:** Pharmacies never see an engineering demo as a product module.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/todos`

**Screens / states**

- 404 for /todos in prod

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Registry flags
- Route guard in production
- E2E assertion

### Out of scope

- Deleting MED0003 todo package

## Business rules

1. `config/remotes.registry.ts` product list excludes `todo` unless `VITE_ENABLE_DEMO_REMOTES=true`.
2. Production CI smoke may hit a hidden route only if explicitly enabled; default e2e `portal.spec.ts` home must not require Todo.
3. `/todos` in production without flag → not found, not a loaded remote.
4. Docs/README must not list Todo as a pharmacy workflow.
5. Host tests fail if production nav config includes Todo.
6. Demo flag never enables Core write APIs.

## API endpoints

No Core endpoint is introduced or called by this story.

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given production env without demo flag, when visiting `/todos`, then Todo MFE does not mount.
2. **AC-002**: Given production nav, when inspecting links, then no href `/todos`.
3. **AC-003**: Given demo flag true in local, when visiting `/todos`, then the existing remote may mount.
4. **AC-004**: Given e2e default, when home loads, then the test does not depend on Todo copy.
5. **AC-005**: Given registry, when listing product remotes, then names match IA remotes not `todo`.
6. **AC-006**: Given CONTRIBUTING, when describing MFEs, then Todo is labelled demo-only.
7. **AC-007**: Given a pharmacist persona, when they search nav, then Todo is absent.
8. **AC-008**: Given build, when `VITE_ENABLE_DEMO_REMOTES` is unset, then it defaults false.

## Test requirements

- Unit: Registry excludes todo by default
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Home has no /todos link
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- MED0003 contracts
- INFORMATION-ARCHITECTURE.md

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
