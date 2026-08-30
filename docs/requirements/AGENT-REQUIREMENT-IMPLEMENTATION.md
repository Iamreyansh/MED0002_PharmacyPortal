# Pharmacy Portal Implementation Tracker

This is the implementation status source of truth for the requirement corpus. Stories are ordered by phase and epic dependency.

Statuses: `pending` | `in_progress` | `staging-deployed` | `production-ready` | `blocked`.

## Progress

| Phase   | Total | Staging-deployed | Production-ready |
| ------- | ----- | ---------------- | ---------------- |
| Phase 1 | 27    | 27               | 0                |
| Phase 2 | 21    | 17               | 0                |
| Phase 3 | 18    | 4                | 0                |
| Phase 4 | 4     | 0                | 0                |
| Total   | 70    | 48               | 0                |

## Phase 1

| Epic      | Story                                                                                                    | Title                                               | Repo    | Status           | Completed  | Notes                      |
| --------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------- | ---------------- | ---------- | -------------------------- |
| EPIC-P001 | [STORY-P001-001](./EPIC-P001-portal-shell/STORY-P001-001-app-chrome-home.md)                             | App chrome and home shortcuts                       | MED0002 | staging-deployed | 2026-08-26 | Host chrome; remotes later |
| EPIC-P001 | [STORY-P001-002](./EPIC-P001-portal-shell/STORY-P001-002-permission-plan-nav.md)                         | Permission- and plan-aware navigation               | MED0002 | staging-deployed | 2026-08-26 | Session from P003      |
| EPIC-P001 | [STORY-P001-003](./EPIC-P001-portal-shell/STORY-P001-003-remote-loader-degraded.md)                      | Remote loading and degraded MFE behaviour           | MED0002 | staging-deployed | 2026-08-26 | MfeOutlet wrapper          |
| EPIC-P001 | [STORY-P001-004](./EPIC-P001-portal-shell/STORY-P001-004-retire-todo-product-nav.md)                     | Retire Todo from product navigation                 | MED0002 | staging-deployed | 2026-08-26 | Demo flag default false    |
| EPIC-P002 | [STORY-P002-001](./EPIC-P002-host-api-capabilities/STORY-P002-001-api-request-facade.md)                 | Host API request facade                             | MED0002 | staging-deployed | 2026-08-26 | Fetch client; envelopes |
| EPIC-P002 | [STORY-P002-002](./EPIC-P002-host-api-capabilities/STORY-P002-002-auth-refresh-intercept.md)             | JWT attach, refresh single-flight, and 401 recovery | MED0002 | staging-deployed | 2026-08-26 | Login UI is auth remote |
| EPIC-P002 | [STORY-P002-003](./EPIC-P002-host-api-capabilities/STORY-P002-003-errors-idempotency-telemetry.md)       | Error mapping, idempotency keys, retries, telemetry | MED0002 | staging-deployed | 2026-08-26 | PII-safe api_error      |
| EPIC-P003 | [STORY-P003-001](./EPIC-P003-auth-session/STORY-P003-001-pharmacy-login.md)                              | Pharmacy staff login                                | MED0002 | staging-deployed | 2026-08-26 | Auth remote screens; host tokens |
| EPIC-P003 | [STORY-P003-002](./EPIC-P003-auth-session/STORY-P003-002-logout-refresh-me.md)                           | Logout, logout-all, and session bootstrap           | MED0002 | staging-deployed | 2026-08-26 | Me + header session menu |
| EPIC-P003 | [STORY-P003-003](./EPIC-P003-auth-session/STORY-P003-003-sessions-revoke.md)                             | Active sessions list and revoke                     | MED0002 | staging-deployed | 2026-08-26 | Auth remote + host onSubmit |
| EPIC-P003 | [STORY-P003-004](./EPIC-P003-auth-session/STORY-P003-004-switch-pharmacy.md)                             | Multi-pharmacy context switch                       | MED0002 | staging-deployed | 2026-08-26 | Header switcher          |
| EPIC-P003 | [STORY-P003-005](./EPIC-P003-auth-session/STORY-P003-005-pos-pin-shell.md)                               | POS PIN login and POS-scoped shell                  | MED0002 | staging-deployed | 2026-08-26 | Auth remote PIN; host tokens |
| EPIC-P003 | [STORY-P003-006](./EPIC-P003-auth-session/STORY-P003-006-route-guards.md)                                | Route guards and onboarding gate                    | MED0002 | staging-deployed | 2026-08-26 | Auth/status/scope guards |
| EPIC-P004 | [STORY-P004-001](./EPIC-P004-onboarding-kyc/STORY-P004-001-register.md)                                  | Pharmacy self-registration                          | MED0003 | staging-deployed | 2026-08-27 | Onboarding remote; host tokens |
| EPIC-P004 | [STORY-P004-002](./EPIC-P004-onboarding-kyc/STORY-P004-002-verify-email-otp.md)                          | Registration email OTP verify and resend            | MED0003 | staging-deployed | 2026-08-27 | Host intercepts verify tokens |
| EPIC-P004 | [STORY-P004-003](./EPIC-P004-onboarding-kyc/STORY-P004-003-registration-status.md)                       | Registration status gate                            | MED0003 | staging-deployed | 2026-08-27 | Host GET registration-status |
| EPIC-P004 | [STORY-P004-004](./EPIC-P004-onboarding-kyc/STORY-P004-004-kyc-documents-submit.md)                      | KYC document upload, list, delete, submit           | MED0003 | staging-deployed | 2026-08-27 | Host FormData KYC + submit |
| EPIC-P005 | [STORY-P005-001](./EPIC-P005-profile-storefront/STORY-P005-001-profile-get-patch.md)                     | View and edit pharmacy profile                      | MED0003 | staging-deployed | 2026-08-27 | Settings remote profile; host onSubmit |
| EPIC-P005 | [STORY-P005-002](./EPIC-P005-profile-storefront/STORY-P005-002-profile-completeness-tax-bank-contact.md) | Completeness, tax, bank account, contact verify     | MED0003 | staging-deployed | 2026-08-27 | Same profile screen; host API |
| EPIC-P005 | [STORY-P005-003](./EPIC-P005-profile-storefront/STORY-P005-003-storefront-toggle.md)                     | Storefront online/offline                           | MED0003 | staging-deployed | 2026-08-27 | Named buttons; header chip |
| EPIC-P006 | [STORY-P006-001](./EPIC-P006-roles-permissions/STORY-P006-001-roles-list-create-delete.md)               | Role catalogue create and delete                    | MED0003 | staging-deployed | 2026-08-29 | Settings remote roles list |
| EPIC-P006 | [STORY-P006-002](./EPIC-P006-roles-permissions/STORY-P006-002-role-permissions-editor.md)                | Role permission editor                              | MED0003 | staging-deployed | 2026-08-29 | Permission matrix; host PUT |
| EPIC-P006 | [STORY-P006-003](./EPIC-P006-roles-permissions/STORY-P006-003-permission-aware-ui-contract.md)           | Document permission-aware UI contract for remotes   | MED0002 | staging-deployed | 2026-08-29 | Shared can(); POS-aware   |
| EPIC-P007 | [STORY-P007-001](./EPIC-P007-subscription-saas-billing/STORY-P007-001-plan-catalogue.md)                 | Plan catalogue with display labels                  | MED0003 | staging-deployed | 2026-08-29 | Subscription remote catalogue; host onSubmit |
| EPIC-P007 | [STORY-P007-002](./EPIC-P007-subscription-saas-billing/STORY-P007-002-subscribe-change-cancel.md)        | Subscribe, upgrade, downgrade, cancel, auto-renew   | MED0003 | staging-deployed | 2026-08-29 | Owner confirms; idempotency keys |
| EPIC-P007 | [STORY-P007-003](./EPIC-P007-subscription-saas-billing/STORY-P007-003-saas-invoices-cashfree.md)         | SaaS invoices and Cashfree pay handoff              | MED0003 | staging-deployed | 2026-08-29 | Public pay fields only; no secrets |
| EPIC-P007 | [STORY-P007-004](./EPIC-P007-subscription-saas-billing/STORY-P007-004-plan-lock-ux.md)                   | Global plan-lock and upgrade prompt                 | MED0002 | staging-deployed | 2026-08-29 | Shared PlanLock; plan_lock_shown |

## Phase 2

| Epic      | Story                                                                                    | Title                                              | Repo    | Status  | Completed | Notes |
| --------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------- | ------- | ------- | --------- | ----- |
| EPIC-P008 | [STORY-P008-001](./EPIC-P008-catalogue-mapping/STORY-P008-001-catalogue-search.md)       | Pharmacy catalogue search                          | MED0003 | staging-deployed | 2026-08-29 | Catalogue remote search; host onSubmit |
| EPIC-P008 | [STORY-P008-002](./EPIC-P008-catalogue-mapping/STORY-P008-002-catalogue-mapping-crud.md) | Catalogue mapping list and CRUD                    | MED0003 | staging-deployed | 2026-08-29 | Mapping table + drawer; host CRUD |
| EPIC-P009 | [STORY-P009-001](./EPIC-P009-inventory/STORY-P009-001-inventory-master.md)               | Inventory list, summary, detail, and product patch | MED0003 | staging-deployed | 2026-08-29 | Inventory remote list/detail; host onSubmit |
| EPIC-P009 | [STORY-P009-002](./EPIC-P009-inventory/STORY-P009-002-batches-expiry-writeoff.md)        | Batches, FEFO, expiry alerts, write-off            | MED0003 | staging-deployed | 2026-08-29 | Batches + expiry; owner write-off |
| EPIC-P009 | [STORY-P009-003](./EPIC-P009-inventory/STORY-P009-003-rack-locations.md)                 | Rack locations, assign, print labels               | MED0003 | staging-deployed | 2026-08-29 | Racks assign/print; host CRUD |
| EPIC-P009 | [STORY-P009-004](./EPIC-P009-inventory/STORY-P009-004-online-visibility.md)              | Online visibility toggle (Growth+)                 | MED0003 | staging-deployed | 2026-08-29 | Growth lock; owner PATCH |
| EPIC-P010 | [STORY-P010-001](./EPIC-P010-procurement/STORY-P010-001-grn-lifecycle.md)                | Purchase GRN create, items, save-and-stock         | MED0003 | staging-deployed | 2026-08-30 | Procurement remote GRN editor; host onSubmit |
| EPIC-P010 | [STORY-P010-002](./EPIC-P010-procurement/STORY-P010-002-grn-csv-import.md)               | GRN CSV import and confirm                         | MED0003 | staging-deployed | 2026-08-30 | CSV FormData preview/confirm; 10MB check |
| EPIC-P010 | [STORY-P010-003](./EPIC-P010-procurement/STORY-P010-003-distributors.md)                 | Distributor directory and price compare (Growth+)  | MED0003 | staging-deployed | 2026-08-30 | Growth lock; owner CRUD + compare |
| EPIC-P010 | [STORY-P010-004](./EPIC-P010-procurement/STORY-P010-004-reorder-purchase-orders.md)      | Reorder suggestions and purchase orders (Growth+)  | MED0003 | staging-deployed | 2026-08-30 | Suggestions + PO send/record-grn |
| EPIC-P011 | [STORY-P011-001](./EPIC-P011-pos/STORY-P011-001-pos-cart.md)                             | POS cart create, get, items, clear                 | MED0003 | staging-deployed | 2026-08-30 | POS remote cart; host onSubmit + in-memory cartId |
| EPIC-P011 | [STORY-P011-002](./EPIC-P011-pos/STORY-P011-002-pos-search-customer-discount.md)         | POS search, attach customer, apply discount        | MED0003 | staging-deployed | 2026-08-30 | Search TEXT/BARCODE; attach find-or-create; discount |
| EPIC-P011 | [STORY-P011-003](./EPIC-P011-pos/STORY-P011-003-pos-checkout.md)                         | POS checkout with FEFO and payments                | MED0003 | staging-deployed | 2026-08-30 | Idempotent checkout; POS token skips PDF fetch |
| EPIC-P011 | [STORY-P011-004](./EPIC-P011-pos/STORY-P011-004-pos-shell-scope.md)                      | POS MFE under pos-scoped token                     | MED0002 | staging-deployed | 2026-08-30 | Envelope navigate/API gates; chrome no Settings |
| EPIC-P012 | [STORY-P012-001](./EPIC-P012-invoices-sales/STORY-P012-001-invoices-pdf-share.md)        | Invoice list, detail, PDF, share                   | MED0003 | staging-deployed | 2026-08-30 | Billing remote invoices/PDF/share; host onSubmit |
| EPIC-P012 | [STORY-P012-002](./EPIC-P012-invoices-sales/STORY-P012-002-invoice-settings.md)          | Invoice settings                                   | MED0003 | staging-deployed | 2026-08-30 | Settings form; owner PATCH; no einvoice IRN |
| EPIC-P012 | [STORY-P012-003](./EPIC-P012-invoices-sales/STORY-P012-003-sales-ledger.md)              | Sales ledger, summary, export                      | MED0003 | staging-deployed | 2026-08-30 | Ledger + summary cards; Excel export |
| EPIC-P012 | [STORY-P012-004](./EPIC-P012-invoices-sales/STORY-P012-004-sales-mark-paid.md)           | Mark sale paid                                     | MED0003 | staging-deployed | 2026-08-30 | Owner confirm dialog; staff hidden |
| EPIC-P013 | [STORY-P013-001](./EPIC-P013-khata-offers/STORY-P013-001-khata-list-detail.md)           | Khata list, detail, payment history (Starter+)     | MED0003 | staging-deployed | 2026-08-30 | Billing remote khata list/detail/history; host onSubmit |
| EPIC-P013 | [STORY-P013-002](./EPIC-P013-khata-offers/STORY-P013-002-khata-repay-remind.md)          | Khata repayment and reminders                      | MED0003 | staging-deployed | 2026-08-30 | Owner remind; repay idempotency; staff hidden |
| EPIC-P013 | [STORY-P013-003](./EPIC-P013-khata-offers/STORY-P013-003-offers-crud-validate.md)        | Pharmacy offers CRUD and validate (Growth+)        | MED0003 | staging-deployed | 2026-08-30 | Offers CRUD/toggle/validate; Growth lock |

## Phase 3

| Epic      | Story                                                                                  | Title                                               | Repo    | Status  | Completed | Notes |
| --------- | -------------------------------------------------------------------------------------- | --------------------------------------------------- | ------- | ------- | --------- | ----- |
| EPIC-P014 | [STORY-P014-001](./EPIC-P014-prescriptions/STORY-P014-001-rx-queue-list-detail.md)     | Rx queue list and detail (Starter+)                 | MED0003 | staging-deployed | 2026-08-30 | Rx remote queue/detail; host onSubmit; Starter lock |
| EPIC-P014 | [STORY-P014-002](./EPIC-P014-prescriptions/STORY-P014-002-rx-approve-reject.md)        | Approve and reject prescriptions                    | MED0003 | staging-deployed | 2026-08-30 | Approve/reject; reject reason; cashier hidden |
| EPIC-P014 | [STORY-P014-003](./EPIC-P014-prescriptions/STORY-P014-003-rx-dispense.md)              | Dispense and dispense-to-billing                    | MED0003 | staging-deployed | 2026-08-30 | Direct dispense; handoff CTA blocked GAP-017 |
| EPIC-P014 | [STORY-P014-004](./EPIC-P014-prescriptions/STORY-P014-004-drug-register.md)            | Schedule H1/X drug register                         | MED0003 | staging-deployed | 2026-08-30 | Drug register; owner retention; Free+ no lock |
| EPIC-P015 | [STORY-P015-001](./EPIC-P015-orders-rx-quotes/STORY-P015-001-rx-quotes-queue.md)       | Rx quote list, quote, decline                       | MED0003 | pending |           |       |
| EPIC-P015 | [STORY-P015-002](./EPIC-P015-orders-rx-quotes/STORY-P015-002-order-accept-reject.md)   | Order accept and reject by id (no inbox)            | MED0003 | pending |           |       |
| EPIC-P015 | [STORY-P015-003](./EPIC-P015-orders-rx-quotes/STORY-P015-003-order-status-advance.md)  | Advance order packing status by id                  | MED0003 | pending |           |       |
| EPIC-P015 | [STORY-P015-004](./EPIC-P015-orders-rx-quotes/STORY-P015-004-order-assign-rider.md)    | Assign rider by order id                            | MED0003 | pending |           |       |
| EPIC-P016 | [STORY-P016-001](./EPIC-P016-settlements/STORY-P016-001-settlement-list.md)            | Settlement history list                             | MED0003 | pending |           |       |
| EPIC-P016 | [STORY-P016-002](./EPIC-P016-settlements/STORY-P016-002-settlement-detail.md)          | Settlement detail                                   | MED0003 | pending |           |       |
| EPIC-P017 | [STORY-P017-001](./EPIC-P017-analytics/STORY-P017-001-analytics-overview.md)           | Analytics overview (Growth+)                        | MED0003 | pending |           |       |
| EPIC-P017 | [STORY-P017-002](./EPIC-P017-analytics/STORY-P017-002-analytics-sales-products.md)     | Sales register and products analytics               | MED0003 | pending |           |       |
| EPIC-P017 | [STORY-P017-003](./EPIC-P017-analytics/STORY-P017-003-analytics-gst-reports.md)        | GST accounts and report catalogue favorites (owner) | MED0003 | pending |           |       |
| EPIC-P018 | [STORY-P018-001](./EPIC-P018-notifications/STORY-P018-001-notification-preferences.md) | Notification preferences                            | MED0003 | pending |           |       |
| EPIC-P018 | [STORY-P018-002](./EPIC-P018-notifications/STORY-P018-002-device-token.md)             | Browser/device token register and unregister        | MED0002 | pending |           |       |
| EPIC-P019 | [STORY-P019-001](./EPIC-P019-support/STORY-P019-001-ticket-create-detail.md)           | Create support ticket and view by id                | MED0003 | pending |           |       |
| EPIC-P019 | [STORY-P019-002](./EPIC-P019-support/STORY-P019-002-ticket-reply-csat-reopen.md)       | Ticket reply, CSAT, reopen                          | MED0003 | pending |           |       |
| EPIC-P019 | [STORY-P019-004](./EPIC-P019-support/STORY-P019-004-help-centre.md)                    | Public help centre and deflection                   | MED0003 | pending |           |       |

## Phase 4

| Epic      | Story                                                                              | Title                                               | Repo    | Status  | Completed | Notes |
| --------- | ---------------------------------------------------------------------------------- | --------------------------------------------------- | ------- | ------- | --------- | ----- |
| EPIC-P021 | [STORY-P021-001](./EPIC-P021-quality-release/STORY-P021-001-e2e-journeys.md)       | End-to-end pharmacy journeys                        | MED0002 | pending |           |       |
| EPIC-P021 | [STORY-P021-002](./EPIC-P021-quality-release/STORY-P021-002-a11y-security-perf.md) | Accessibility, security, and performance acceptance | MED0002 | pending |           |       |
| EPIC-P021 | [STORY-P021-003](./EPIC-P021-quality-release/STORY-P021-003-failure-recovery.md)   | Failure recovery drills                             | MED0002 | pending |           |       |
| EPIC-P021 | [STORY-P021-004](./EPIC-P021-quality-release/STORY-P021-004-release-acceptance.md) | Release acceptance checklist                        | MED0002 | pending |           |       |
