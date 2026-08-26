# STORY-P014-001: Rx queue list and detail (Starter+)

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P014-001` |
| Epic | [EPIC-P014](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-rx` |
| Minimum plan | `STARTER+` |

## Overview

GET list/detail. FREE PLAN_UPGRADE_REQUIRED.

**Business value:** Pharmacist sees pending Rx in one place.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated pharmacy owner|staff`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/prescriptions`
- `/prescriptions/:rxId`

**Screens / states**

- Rx queue
- Rx detail

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Queue
- Detail

### Out of scope

- Editing Core Rx master

## Business rules

1. FREE lock with PLAN_UPGRADE_REQUIRED.
2. Show timestamps if present; no extra SLA API.
3. Schedule flags visible.
4. Images via Core URL only.
5. Pagination/filter status.
6. All authenticated pharmacy owners and staff may use the queue; no prescriptions:verify permission is enforced by Core.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/prescriptions` | Bearer | PLAN_UPGRADE_REQUIRED |
| GET | `/api/v1/pharmacy/prescriptions/{rxId}` | Bearer | PLAN_UPGRADE_REQUIRED, RX_NOT_FOUND |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given FREE, when /prescriptions, then lock.
2. **AC-002**: Given a Starter pharmacy owner or staff actor, when the list succeeds, then PENDING_REVIEW prescriptions are displayed.
3. **AC-003**: Given detail, when rxId, then lines and schedule.
4. **AC-004**: Given 404, when unknown, then not-found.
5. **AC-005**: Given cashier without permission, when nav, then omitted or 403.
6. **AC-006**: Given image url, when present, then displayed.
7. **AC-007**: Given empty queue, when none, then empty.
8. **AC-008**: Given a11y, when status, then text not colour-only.

## Test requirements

- Unit: Free lock Rx
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Detail
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-008 STORY-002/004

**Implemented Core references**

- EPIC-008 STORY-002

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
