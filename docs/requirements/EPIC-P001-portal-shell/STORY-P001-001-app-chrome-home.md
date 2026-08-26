# STORY-P001-001: App chrome and home shortcuts

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P001-001` |
| Epic | [EPIC-P001](./EPIC.md) |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0002` |
| Screen owner | `host` |
| Minimum plan | `FREE+` |

## Overview

The host paints a pharmacy console frame: header (pharmacy name placeholder until auth), sidebar landmarks, and a home page of module shortcuts. Until EPIC-P003, shortcuts may be inert or route-gated as unauthenticated.

**Business value:** Staff recognise a shop console instead of a Todo demo.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/`

**Screens / states**

- Home shortcut grid
- Empty host outlet

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Header/sidebar/outlet
- Home shortcut grid
- data-testid portal-nav / portal-home

### Out of scope

- Live pharmacy name from JWT
- Todo as a product card

## Business rules

1. Product nav never includes a Todo item in production builds.
2. Landmarks: banner, navigation, main.
3. Home shortcuts follow IA groups even if some routes 404 until later epics land.
4. Collapsed sidebar under 1024px; bottom nav under 768px per IA.
5. Host does not call Core in this story.
6. Visual focus order matches DOM order.

## API endpoints

No Core endpoint is introduced or called by this story.

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given a production build, when the user opens `/`, then the page exposes `data-testid=portal-home` and no Todo nav link.
2. **AC-002**: Given viewport 1280px, when the shell renders, then a persistent sidebar lists IA groups.
3. **AC-003**: Given viewport 375px, when the shell renders, then primary groups are in a bottom nav.
4. **AC-004**: Given the home grid, when a shortcut exists, then it uses the IA route from INFORMATION-ARCHITECTURE.md.
5. **AC-005**: Given keyboard only, when the user tabs, then focus is visible on nav links.
6. **AC-006**: Given a missing remote later, when home still renders, then chrome remains (boundary is STORY-P001-003).
7. **AC-007**: Given `en-IN`, when copy renders, then amounts that appear use ₹ if any placeholder money is shown.
8. **AC-008**: Given reduced motion, when the shell loads, then no essential info is motion-only.

## Test requirements

- Unit: App chrome landmarks and Todo absence
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Home renders without Todo nav
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- MED0003 contracts
- INFORMATION-ARCHITECTURE.md

**Implemented Core references**

- n/a — host only

**Shared portal requirements**

- `PRODUCT-IDEOLOGY.md`
- `PERSONAS-RBAC-PLAN-MATRIX.md`
- `API-INTEGRATION-CONTRACT.md`
- `DOMAIN-STATE-MACHINES.md`
- `ERROR-AND-RECOVERY-CATALOG.md`
- `UX-ACCESSIBILITY-STANDARDS.md`
- `NON-FUNCTIONAL-REQUIREMENTS.md`

## Notes

- Current `src/app/App.tsx` and `HomePage` are the starting files.
