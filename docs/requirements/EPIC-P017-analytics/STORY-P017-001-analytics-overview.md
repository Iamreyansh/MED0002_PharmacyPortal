# STORY-P017-001: Analytics overview (Growth+)

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P017-001` |
| Epic | [EPIC-P017](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | staging-deployed |
| Target repository | `MED0003` |
| Screen owner | `mfe-analytics` |
| Minimum plan | `RETAIL_PRO+` |

## Overview

GET /pharmacy/analytics/overview. PLAN_UPGRADE_REQUIRED on Free/Starter.

**Business value:** Owner sees whether the day is working.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/analytics`

**Screens / states**

- Overview
- Lock

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Overview from payload

### Out of scope

- Custom SQL

## Business rules

1. Lock → Growth+.
2. Do not fabricate series.
3. Date range as Core.
4. All authenticated pharmacy owners and staff may read analytics overview; Core does not enforce reports:read.
5. FY helper if period required.
6. No PII in charts.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/analytics/overview` | Bearer | PLAN_UPGRADE_REQUIRED |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given FREE, when /analytics, then lock Growth+.
2. **AC-002**: Given RETAIL_PRO, when GET overview, then cards render.
3. **AC-003**: Given empty metrics, when zeros, then empty not fake trend.
4. **AC-004**: Given date filter, when applied, then query sent.
5. **AC-005**: Given cashier 403 on permission, when plan is Pro, then forbidden not upgrade.
6. **AC-006**: Given loading skeleton.
7. **AC-007**: Given error retry.
8. **AC-008**: Given a11y charts, when present, then text alternative.

## Test requirements

- Unit: Lock analytics
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Overview render
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-016 STORY-004

**Implemented Core references**

- EPIC-016 STORY-004

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
