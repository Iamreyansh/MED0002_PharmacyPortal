# STORY-P019-004: Public help centre and deflection

| Attribute | Value |
| --- | --- |
| Story ID | `STORY-P019-004` |
| Epic | [EPIC-P019](./EPIC.md) |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Status | pending |
| Target repository | `MED0003` |
| Screen owner | `mfe-support` |
| Minimum plan | `FREE+` |

## Overview

Browse the implemented public help catalogue, open an article, and record a deflection outcome without requiring a pharmacy session.

**Business value:** Pharmacy staff can resolve common questions before raising a ticket.

## User roles and access

**Personas**

- `pharmacy_owner`
- `pharmacy_staff`

**Permissions / restrictions**

- `authenticated`

Core remains authoritative for JWT role, active pharmacy, plan/module gates, pharmacy lifecycle, and token scope. The UI must still recover from a server `403` even when it hid or locked the action optimistically.

## Routes and screens

**Routes**

- `/help`
- `/help/articles/:id`

**Screens / states**

- Help landing
- Article detail
- Helpful feedback

Every data screen includes loading, empty, error, and permission/plan states that apply under `UX-ACCESSIBILITY-STANDARDS.md`.

## Scope

### In scope

- Help landing
- Article detail
- Deflection feedback

### Out of scope

- Admin article editing
- Live chat provider
- Ticket inbox

## Business rules

1. Help GET endpoints are public and must not attach or expose pharmacy credentials unnecessarily.
2. Article IDs and response fields come from Core; no bundled duplicate knowledge base.
3. Deflection logging body follows the Core DTO and contains no prescription, bank, or order payload.
4. A missing article shows not-found and a link back to the help landing page.
5. Search/filter controls are shown only if the help response contract supports them.
6. Raise-ticket CTA routes to /support/new for authenticated users and /login with a safe return URL for anonymous users.

## API endpoints

| Method | Path | Auth / scope | Primary errors |
| --- | --- | --- | --- |
| GET | `/api/v1/support/help` | public | — |
| GET | `/api/v1/support/help/articles/{id}` | public | HELP_ARTICLE_NOT_FOUND |
| POST | `/api/v1/support/help/deflection` | public | VALIDATION_ERROR |

Requests and responses follow `API-INTEGRATION-CONTRACT.md`. Endpoint DTO field names come from the cited Core controller/Bruno request at implementation time; this story does not authorize guessed fields.

## Data contracts

- No portal-owned persistent domain model. Use the cited Core request/response DTOs and host/MFE view state only.

## Acceptance criteria

1. **AC-001**: Given the help landing page, when Core returns articles, then the catalogue renders from the response.
2. **AC-002**: Given an article id, when detail succeeds, then its title and body are displayed using safe React text rendering.
3. **AC-003**: Given an unknown article, when Core returns HELP_ARTICLE_NOT_FOUND, then the page offers a link back to /help.
4. **AC-004**: Given a helpful or not-helpful action, when submitted, then POST deflection uses the Core DTO.
5. **AC-005**: Given an anonymous visitor, when help loads, then no login redirect is required.
6. **AC-006**: Given a ticket CTA while anonymous, when activated, then login receives only a safe /support/new return route.
7. **AC-007**: Given Core has no search parameter, when the page renders, then it does not invent server-side search.
8. **AC-008**: Given keyboard-only use, when browsing articles and feedback, then all controls have visible focus and accessible names.

## Test requirements

- Unit: Public help and article not-found
- Contract: happy envelope `success: true` and primary error code from the endpoint table
- E2E: Browse help then open article
- A11y: labelled controls, focus visible, lock/error not colour-only

## Dependencies and references

**Epic dependencies**

- Core EPIC-015 STORY-001/002

**Implemented Core references**

- EPIC-015 STORY-003 PublicHelpController

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
