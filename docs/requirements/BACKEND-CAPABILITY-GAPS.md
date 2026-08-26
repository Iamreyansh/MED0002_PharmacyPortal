# Backend Capability Gaps

These features are promised by one or more source PDFs but are not valid frontend implementation stories against the currently implemented pharmacy-facing Core API. They stay out of the epic backlog until Core supplies a secure tenant-scoped contract.

| Gap | Capability | Source promise | Current constraint | Required next step |
| --- | --- | --- | --- | --- |
| GAP-001 | Dashboard KPI aggregate and attention queue | Dashboard today cards, sales analytics, expiring/top sellers/recent transactions | No single pharmacy-facing dashboard aggregate contract | Core: add a tenant-scoped dashboard summary contract, or approve composition from existing endpoints with explicit budgets |
| GAP-002 | Online order inbox and detail | Orders table, filters, timeline, invoice/order detail | Core exposes pharmacy order mutations by id but no pharmacy list/detail GET | Core: add tenant-scoped paginated list and detail; then replace P015 id-in-hand limitation |
| GAP-003 | Rider picker for pharmacy dispatch | Assign a delivery partner from an available list | No pharmacy-facing rider directory/recommendation GET | Core: expose safe candidates or keep assignment fully automatic/admin-owned |
| GAP-004 | Pharmacy customer database and Patient 360 | Customer history, loyalty, clinical profile, refills, segmentation | No pharmacy-scoped customer/CRM APIs | Core: define consent, tenancy, PII fields, and pharmacy-facing CRM contracts |
| GAP-005 | CRM campaigns and refill automation UI | Segments, reminders, campaigns, attributed revenue | CRM APIs are Admin HQ/SaaS management, not pharmacy tenant APIs | Core: add pharmacy CRM campaign/reminder APIs with consent and communication controls |
| GAP-006 | Employee and staff account lifecycle | Employee records/payroll, invite/login, PIN, deactivate, share credentials | Role CRUD exists; staff invite/PIN/user CRUD does not | Core: add staff lifecycle APIs; never display generated passwords as the PDF demo suggests |
| GAP-007 | Expenses and accountant/advisor sharing | Expense register, CA directory, secure no-login report links | No pharmacy-facing expense/advisor/share APIs | Core: add expense ledger and revocable report-share capability |
| GAP-008 | Referral programme for pharmacies | Referral code, sharing, earnings and referral table | No pharmacy-facing referral APIs | Core/CRM: expose tenant referral programme contracts |
| GAP-009 | Hospital/IPD suite | Wards, admissions, hospital billing, patients, indents, departments, doctors | No implemented pharmacy-facing IPD contracts | Separate backend epic required before portal stories |
| GAP-010 | Self-order kiosk | Configuration, kiosk catalogue/cart/payment/token | No kiosk API or security model | Separate backend + MFE architecture; do not reuse privileged portal tokens |
| GAP-011 | In-app notifications inbox | Unread badges and notification list | Device-token and preferences exist; pharmacy inbox GET does not | Core: add actor-scoped inbox/read contracts or keep push-only |
| GAP-012 | Support ticket inbox and dispute history | List/search all shop tickets and disputes | Ticket detail is id-in-hand; pharmacy dispute creation is not authorized | Core: add tenant-scoped list/detail contracts with redaction |
| GAP-013 | Advanced invoice designer and legal e-invoicing | Templates, logo/signature preview, IRN/e-invoice operations | Current invoice settings/PDF subset does not expose the full demo surface | Core: explicitly model supported settings; e-invoice integration remains server-side |
| GAP-014 | Automated KYC, performance guardrails, auto-reorder controls | Autonomous pharmacy operations | Automation is backend/Admin HQ and manual KYC is the implemented production decision | Core/Admin: implement governed automation; portal later surfaces outcomes/appeals only |
| GAP-015 | Full pharmacy report/export catalogue | Excel/PDF across every table and report family | Only endpoint-specific exports are implementable | Core: add exports per resource; portal must not fabricate PDFs from partial data as legal reports |
| GAP-016 | Multi-branch enterprise administration | Unlimited branches and branch switching/rollups | Auth can switch assigned pharmacies; no branch CRUD/rollup suite | Core: define organization/branch ownership and aggregate permissions |
| GAP-017 | Real prescription-to-POS handoff | Dispense → billing sends verified Rx lines into POS | Current Core PosDispensePort returns generated identifiers without creating a real POS cart | Core: wire prescription dispense-to-billing to POS cart creation and add an integration test before enabling the portal CTA |
| GAP-018 | Customer-view storefront preview | Online Store includes a preview matching the customer app | Inventory visibility and storefront toggle exist, but no pharmacy-facing customer-preview contract exists | Core/customer app: expose a safe read projection or deep-link to the real customer storefront |
| GAP-019 | Pharmacy delivery handoff / pickup OTP visibility | Orders screen hands a packed order to delivery | Pickup confirmation is rider-only and no pharmacy endpoint exposes the handoff OTP/candidate state | Core: decide whether rider-only pickup is sufficient; add a minimal pharmacy handoff contract only if operations require it |
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
