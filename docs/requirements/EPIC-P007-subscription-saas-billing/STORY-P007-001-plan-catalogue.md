# STORY-P007-001: Plan catalogue with display labels

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P007-001` |
| Epic | [EPIC-P007](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-subscription` |
| Minimum plan | `FREE+` |

## Overview

GET /pharmacy/subscription/plans. Map names to display labels. Show seats and invoice caps from payload, not marketing INDEX.

**Business value:** Owners know what they pay for.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/subscription`

**Screens / states**

- Plan catalogue

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Plan cards
- Current plan chip

### Out of scope

- Editing module matrix

## Business rules

1. FREE→Free, STARTER→Starter, RETAIL_PRO→Growth, ENTERPRISE→Pro.
2. Prices from price_monthly_rs / price_annual_rs.
3. included_modules listed as returned.
4. The plan catalogue endpoint is owner-only; owner and staff may read the current subscription.
5. Staff see current-plan context but do not receive owner-only plan-change controls.
6. Do not show Hospital/IPD or Kiosk as included modules unless Core payload contains them.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/pharmacy/subscription/plans` | Bearer owner | FORBIDDEN |
| GET | `/api/v1/pharmacy/subscription` | Bearer owner\|staff | FORBIDDEN |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given plans GET, when RETAIL_PRO card renders, then title is Growth and name enum is available to APIs.
2. **AC-002**: Given current_plan STARTER, when catalogue, then Starter marked current.
3. **AC-003**: Given seat_limit 1 on FREE, when shown, then it is 1 not 2.
4. **AC-004**: Given staff, when visiting, then forbidden.
5. **AC-005**: Given ENTERPRISE custom price, when null/custom, then copy says Contact us / custom — not a fake ₹2999 if payload differs.
6. **AC-006**: Given modules list, when Hospital absent, then Hospital is not claimed.
7. **AC-007**: Given loading, when GET, then skeletons for 4 cards.
8. **AC-008**: Given a11y, when cards, then current plan is not colour-only.

## Test requirements

- Unit: Label mapping
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Catalogue owner-only
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-014
- Cashfree pg checkout fields from pay response

**Implemented Core references**

- EPIC-014 STORY-001

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
