# STORY-P001-003: Remote loading and degraded MFE behaviour

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P001-003` |
| Epic | [EPIC-P001](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0002` |
| Screen owner | `host` |
| Minimum plan | `FREE+` |

## Overview

RemoteLoader fetches mf-manifest.json, mounts default export with MfeDataEnvelope, and isolates failures.

**Business value:** One broken MFE must not blank the pharmacy console.

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

- Module error panel

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- RemoteLoader
- contractVersion gate
- error boundary
- retry

### Out of scope

- Implementing remote UIs

## Business rules

1. Envelope `contractVersion` must be `1.0.0`; mismatch shows upgrade/reload, does not crash.
2. Remotes receive `data` only — no sibling callback props.
3. Load error: `data-testid=remote-error`, Retry, rest of chrome works.
4. Timeouts use a finite budget (NFR 2s first paint target) then error state.
5. Capabilities missing → remote must no-op safely; host still passes the object.
6. Do not read remote localStorage from the host.

## API endpoints

No Core endpoint is introduced or called by this story.

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given a 404 manifest, when navigating to that module, then remote-error is shown and sidebar remains.
2. **AC-002**: Given Retry, when the manifest later succeeds, then the remote mounts.
3. **AC-003**: Given contractVersion 0.0.1, when mounted, then the host refuses and explains mismatch.
4. **AC-004**: Given a thrown render in the remote, when the boundary catches, then other routes still navigate.
5. **AC-005**: Given telemetry capability, when load fails, then `mfe_load_error` is emitted without PII.
6. **AC-006**: Given a healthy remote, when mounted, then `context.hostId` is `pharmacy-portal`.
7. **AC-007**: Given two remotes, when one fails, then the other route still works.
8. **AC-008**: Given keyboard, when error Retry is focused, then Enter retriggers load.

## Test requirements

- Unit: RemoteLoader error boundary
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Broken manifest does not hide nav
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- MED0003 contracts
- INFORMATION-ARCHITECTURE.md

**Implemented Core references**

- MED0003 data-contract.md

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
