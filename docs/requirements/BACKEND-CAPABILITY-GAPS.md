# Backend Capability Gaps

These features are promised by one or more source PDFs but are not valid frontend implementation stories against the currently implemented pharmacy-facing Core API. They stay out of the epic backlog until Core supplies a secure tenant-scoped contract.

| Gap | Capability | Source promise | Current constraint | Required next step |
| --- | --- | --- | --- | --- |
| GAP-001 | Dashboard KPI aggregate and attention queue | Dashboard today cards, sales analytics, expiring/top sellers/recent transactions | **In-tree 2026-08-31:** `GET /api/v1/pharmacy/dashboard/summary` (order status counts). Host home KPIs consume it. Expiring/top-sellers still analytics Growth+ | Deploy Core |
| GAP-002 | Online order inbox and detail | Orders table, filters, timeline, invoice/order detail | **In-tree 2026-08-31:** `GET /api/v1/pharmacy/orders` + `GET /{id}` (tenant-scoped). Needs Core deploy + portal e2e evidence | Deploy Core; keep GAP open until D2 |
| GAP-003 | Rider picker for pharmacy dispatch | Assign a delivery partner from an available list | **In-tree 2026-08-31:** `GET /api/v1/pharmacy/riders` + order-actions picker. UUID fallback remains | Deploy Core |
| GAP-004 | Pharmacy customer database and Patient 360 | Customer history, loyalty, clinical profile, refills, segmentation | **In-tree 2026-08-31:** `GET /api/v1/pharmacy/customers` distinct POS invoice customers. No Patient 360 / loyalty | Deploy Core; campaigns remain GAP-005 |
| GAP-005 | CRM campaigns and refill automation UI | Segments, reminders, campaigns, attributed revenue | CRM APIs are Admin HQ/SaaS management, not pharmacy tenant APIs | Core: add pharmacy CRM campaign/reminder APIs with consent and communication controls |
| GAP-006 | Employee and staff account lifecycle | Employee records/payroll, invite/login, PIN, deactivate, share credentials | **In-tree 2026-08-31:** invite/list/deactivate/POS PIN + complete-invite. Token shown once to owner (not a generated password). Payroll still absent | Deploy Core; host staff UI still missing |
| GAP-007 | Expenses and accountant/advisor sharing | Expense register, CA directory, secure no-login report links | No pharmacy-facing expense/advisor/share APIs | Core: add expense ledger and revocable report-share capability |
| GAP-008 | Referral programme for pharmacies | Referral code, sharing, earnings and referral table | No pharmacy-facing referral APIs | Core/CRM: expose tenant referral programme contracts |
| GAP-009 | Hospital/IPD suite | Wards, admissions, hospital billing, patients, indents, departments, doctors | No implemented pharmacy-facing IPD contracts | Separate backend epic required before portal stories |
| GAP-010 | Self-order kiosk | Configuration, kiosk catalogue/cart/payment/token | No kiosk API or security model | Separate backend + MFE architecture; do not reuse privileged portal tokens |
| GAP-011 | In-app notifications inbox | Unread badges and notification list | **In-tree 2026-08-31:** `GET /api/v1/pharmacy/notifications` + host `/notifications`. Writers not yet hooked to order events | Deploy Core; hook notice inserts |
| GAP-012 | Support ticket inbox and dispute history | List/search all shop tickets and disputes | **In-tree 2026-08-31:** `GET /api/v1/support/tickets` pharmacy list + `/support` list UI. Disputes still customer-only | Deploy Core |
| GAP-013 | Advanced invoice designer and legal e-invoicing | Templates, logo/signature preview, IRN/e-invoice operations | Current invoice settings/PDF subset does not expose the full demo surface | Core: explicitly model supported settings; e-invoice integration remains server-side |
| GAP-014 | Automated KYC, performance guardrails, auto-reorder controls | Autonomous pharmacy operations | Automation is backend/Admin HQ and manual KYC is the implemented production decision | Core/Admin: implement governed automation; portal later surfaces outcomes/appeals only |
| GAP-015 | Full pharmacy report/export catalogue | Excel/PDF across every table and report family | Only endpoint-specific exports are implementable | Core: add exports per resource; portal must not fabricate PDFs from partial data as legal reports |
| GAP-016 | Multi-branch enterprise administration | Unlimited branches and branch switching/rollups | **In-tree 2026-08-31:** `GET /api/v1/pharmacy/rollup/summary` (Growth+ when 2+ shops). Auth switch-pharmacy already exists. No branch CRUD | Deploy Core |
| GAP-017 | Real prescription-to-POS handoff | Dispense → billing sends verified Rx lines into POS | **In-tree 2026-08-31:** `PosCartDispenseAdapter` creates a real POS cart and adds catalogue name matches. Unmatched lines stay for manual add | Deploy Core; IT against live inventory |
| GAP-018 | Customer-view storefront preview | Online Store includes a preview matching the customer app | Inventory visibility and storefront toggle exist, but no pharmacy-facing customer-preview contract exists | Core/customer app: expose a safe read projection or deep-link to the real customer storefront |
| GAP-019 | Pharmacy delivery handoff / pickup OTP visibility | Orders screen hands a packed order to delivery | **In-tree 2026-08-31:** `GET /api/v1/pharmacy/orders/{id}/handoff` returns pharmacy pickup OTP after ready. Customer delivery OTP is never exposed | Deploy Core |
| GAP-020 | POS barcode/batch scanning and loose-tablet semantics | POS scanner adds a barcode/batch instantly and supports per-tablet loose sales | The POS search/cart contract does not explicitly document scanner lookup or loose-unit conversion semantics | Core: expose and test barcode/batch lookup plus pack-to-loose rules, or confirm the existing DTOs cover them |
| GAP-021 | Prescription operational KPIs and SLA insights | Pending/over-SLA, turnaround, digital share, prescriber and compliance insight cards | No pharmacy aggregate contract supplies the promised KPI and insight set | Core: add a tenant-scoped Rx summary/insights endpoint or approve bounded composition |
| GAP-022 | Full online-store listing merchandising | Online price, offer assignment, listing management, and customer preview | Existing storefront, mapping, inventory visibility, and offer APIs do not provide a joined customer-visible listing projection | Core: add a tenant-scoped online-listings projection/mutation contract |
| GAP-023 | Accounting configuration, sync, and Tally export | Tally / Zoho Books integration and accountant workflows | Security matchers and Bruno placeholders exist, but Core has no accounting controller or service and production audit defers it | Core: implement owner-scoped config, sync job/status, and export contracts before restoring a portal epic |
| GAP-024 | Pharmacy-created order disputes | Pharmacy support/dispute workflow | POST /support/disputes is customer-only; DisputeService rejects pharmacy tokens | Core: decide whether pharmacies can dispute orders and add an explicitly pharmacy-scoped contract if required |

## Rules for closing a gap

1. Add or identify the Core controller, request/response DTOs, authorization, plan gate, state rules, and Bruno request.
2. Verify pharmacy tenancy comes from JWT unless an explicit safe exception is documented.
3. Add the portal epic/story or extend the named epic with acceptance criteria and contract tests.
4. Remove the gap only after the endpoint is implemented and the requirement corpus is regenerated.

This file is not a commitment that every gap must be built. Product and backend teams should apply YAGNI and prioritize the smallest capability that supports the real pharmacy workflow.
