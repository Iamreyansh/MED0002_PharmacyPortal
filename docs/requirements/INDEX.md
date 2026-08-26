# Namma MedMate Pharmacy Portal — Requirements Index

| Field | Value |
| --- | --- |
| Product | Pharmacy Portal / Partner Console |
| Host repository | `MED0002_PharmacyPortal` |
| Domain MFE repository | `MED0003_MFE` |
| Backend | `MED0001_Core` `/api/v1` |
| Epics | 20 |
| Stories | 70 |
| Initial status | `pending` |
| Core implementation snapshot | 122/122 backend stories staging-deployed; 0 production-ready |
| Generated | 2026-08-26 |

## Scope decision

This is the implementation backlog for the pharmacy portal described by the source feature guides, constrained by pharmacy-facing capabilities currently implemented in Core. A source feature without an implemented Core contract is listed in `BACKEND-CAPABILITY-GAPS.md`; it is not represented as a buildable frontend story.

In this corpus, “implemented Core contract” means present in the staging-deployed backend and Bruno collection. It does **not** mean production-ready: Core's current production-readiness audit is NO-GO and no backend story is marked `production-ready`.

The portal is a federated product:

- `MED0002` owns the host shell, session/tokens, API capability, navigation, telemetry, and release acceptance.
- `MED0003` owns domain screens and consumes Core only through the host `MfeDataEnvelope`.
- `MED0001` remains authoritative for business rules, tenancy, state machines, plan gates, permissions, money, compliance, and side effects.

## Source set

- `MED0001_Core/docs/requirements/Namma_MedMate_Pharmacy_Dashboard_Features.pdf`
- `MED0001_Core/docs/requirements/Namma_MedMate_Customer_App_Features.pdf`
- `MED0001_Core/docs/requirements/Namma_MedMate_Admin_HQ_Features.pdf`
- `MED0001_Core/docs/requirements/Namma_MedMate_Autonomous_Operations_Blueprint.pdf`
- `MED0001_Core/docs/requirements/Namma_MedMate_Autonomous_Operations_Blueprint (1).pdf`
- `MED0001_Core/docs/requirements/INDEX.md`
- `MED0001_Core/docs/requirements/AGENT-REQUIREMENT-IMPLEMENTATION.md`
- `MED0001_Core controllers, DTOs, security filters, tests, and Bruno requests`

The two Autonomous Operations Blueprint PDFs are duplicate source copies and therefore contribute one set of requirements.

## Shared requirements

- [Product ideology](./PRODUCT-IDEOLOGY.md)
- [Information architecture](./INFORMATION-ARCHITECTURE.md)
- [Personas, RBAC, and plan matrix](./PERSONAS-RBAC-PLAN-MATRIX.md)
- [API integration contract](./API-INTEGRATION-CONTRACT.md)
- [Domain state machines](./DOMAIN-STATE-MACHINES.md)
- [Error and recovery catalog](./ERROR-AND-RECOVERY-CATALOG.md)
- [UX and accessibility standards](./UX-ACCESSIBILITY-STANDARDS.md)
- [Non-functional requirements](./NON-FUNCTIONAL-REQUIREMENTS.md)
- [Source traceability](./SOURCE-TRACEABILITY.md)
- [Backend capability gaps](./BACKEND-CAPABILITY-GAPS.md)
- [Implementation tracker](./AGENT-REQUIREMENT-IMPLEMENTATION.md)

## Epic registry

### Phase 1 — Foundation, access, and commercial shell

| Epic | Title | Repo | Owner | Priority | Stories |
| --- | --- | --- | --- | --- | --- |
| [EPIC-P001](./EPIC-P001-portal-shell/EPIC.md) | Portal Shell and Navigation | MED0002 | host | P0 | 4 |
| [EPIC-P002](./EPIC-P002-host-api-capabilities/EPIC.md) | Host API Client and Capabilities | MED0002 | host | P0 | 3 |
| [EPIC-P003](./EPIC-P003-auth-session/EPIC.md) | Authentication, Session, and POS PIN | MED0002 | mfe-auth | P0 | 6 |
| [EPIC-P004](./EPIC-P004-onboarding-kyc/EPIC.md) | Registration and KYC | MED0003 | mfe-onboarding | P0 | 4 |
| [EPIC-P005](./EPIC-P005-profile-storefront/EPIC.md) | Pharmacy Profile and Storefront | MED0003 | mfe-settings | P0 | 3 |
| [EPIC-P006](./EPIC-P006-roles-permissions/EPIC.md) | Roles and Permissions UI | MED0003 | mfe-settings | P1 | 3 |
| [EPIC-P007](./EPIC-P007-subscription-saas-billing/EPIC.md) | Plans, Subscription, and SaaS Billing | MED0003 | mfe-subscription | P0 | 4 |
### Phase 2 — Counter and stock operations

| Epic | Title | Repo | Owner | Priority | Stories |
| --- | --- | --- | --- | --- | --- |
| [EPIC-P008](./EPIC-P008-catalogue-mapping/EPIC.md) | Catalogue Search and Mapping | MED0003 | mfe-catalogue | P0 | 2 |
| [EPIC-P009](./EPIC-P009-inventory/EPIC.md) | Inventory, Batches, and Racks | MED0003 | mfe-inventory | P0 | 4 |
| [EPIC-P010](./EPIC-P010-procurement/EPIC.md) | Purchases, Distributors, and Reorder | MED0003 | mfe-procurement | P0 | 4 |
| [EPIC-P011](./EPIC-P011-pos/EPIC.md) | Point of Sale | MED0003 | mfe-pos | P0 | 4 |
| [EPIC-P012](./EPIC-P012-invoices-sales/EPIC.md) | GST Invoices and Sales Ledger | MED0003 | mfe-billing | P0 | 4 |
| [EPIC-P013](./EPIC-P013-khata-offers/EPIC.md) | Khata Credit and Pharmacy Offers | MED0003 | mfe-billing | P1 | 3 |
### Phase 3 — Fulfilment, money, and engagement

| Epic | Title | Repo | Owner | Priority | Stories |
| --- | --- | --- | --- | --- | --- |
| [EPIC-P014](./EPIC-P014-prescriptions/EPIC.md) | Prescription Queue and Drug Register | MED0003 | mfe-rx | P0 | 4 |
| [EPIC-P015](./EPIC-P015-orders-rx-quotes/EPIC.md) | Rx Quotes and Order Lifecycle Actions | MED0003 | mfe-orders | P0 | 4 |
| [EPIC-P016](./EPIC-P016-settlements/EPIC.md) | Marketplace Settlements | MED0003 | mfe-finance | P1 | 2 |
| [EPIC-P017](./EPIC-P017-analytics/EPIC.md) | Pharmacy Analytics and Reports | MED0003 | mfe-analytics | P1 | 3 |
| [EPIC-P018](./EPIC-P018-notifications/EPIC.md) | Notification Preferences and Device Tokens | MED0003 | mfe-settings | P1 | 2 |
| [EPIC-P019](./EPIC-P019-support/EPIC.md) | Support Tickets and Help Centre | MED0003 | mfe-support | P1 | 3 |
### Phase 4 — Release hardening

| Epic | Title | Repo | Owner | Priority | Stories |
| --- | --- | --- | --- | --- | --- |
| [EPIC-P021](./EPIC-P021-quality-release/EPIC.md) | Cross-domain Quality and Release Acceptance | MED0002 | host | P0 | 4 |

## Delivery order

1. Phase 1 makes the host real, authenticates pharmacy actors, completes KYC/profile, and establishes plan-aware access.
2. Phase 2 delivers the minimum useful pharmacy ERP loop: catalogue → inventory/procurement → POS → invoice/sales/khata.
3. Phase 3 adds regulated Rx handling, marketplace fulfilment actions, settlement visibility, analytics, notifications, and support.
4. Phase 4 applies cross-domain quality, resilience, accessibility, and release gates.

Within a phase, use `AGENT-REQUIREMENT-IMPLEMENTATION.md` order and do not start a story until its listed epic/Core dependencies are available.

## Status vocabulary

`pending` → `in_progress` → `staging-deployed` → `production-ready`

Use `blocked` when an implemented story cannot proceed because a cited dependency or endpoint is unavailable. Do not use `done`.
