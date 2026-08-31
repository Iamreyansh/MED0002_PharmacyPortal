# Production release checklist — Pharmacy ERP+CRM

Single source of work remaining to take MED0001 + MED0002 + MED0003 from
`staging-deployed` to **production-ready**. Written 2026-08-31 from the
requirements-to-production audit. Status values: `open` · `in_progress` ·
`fixed-in-tree` · `human` · `wont-fix-here`.

**Release rule:** a row is `human` only when it needs a secret, vendor
account, AWS apply, or a second tenant/role that this workspace cannot
create. Everything else must be fixed in code before tomorrow’s ship.

**Out of this pass:** visual/UI polish. Behaviour, contracts, authz, and
error envelopes are in scope.

---

## How to use this file

1. Work top to bottom within each priority band (P0 → P1 → P2).
2. Mark `fixed-in-tree` only after unit tests for that change pass.
3. Do not mark `production-ready` on story trackers until the matching
   Core/portal deploy evidence exists (D2).

---

## P0 — launch blockers

| ID | Repo | Defect | Expected | Observed / gap | Human? | Status |
| --- | --- | --- | --- | --- | --- | --- |
| P0-01 | MED0001 | `CrmModuleAccessFilter` throws `AppException` in a servlet filter | 403 `MODULE_NOT_IN_PLAN` envelope | Staging shows 401/500 on plan-gated modules | No | fixed-in-tree |
| P0-02 | MED0001 | Missing query params become 500 | 422 `VALIDATION_ERROR` / `INVALID_SCHEDULE` | `GET drug-register` without `schedule` → 500 | No | fixed-in-tree |
| P0-03 | MED0001 | Drug register requires `schedule` and UI allows All | Optional/`ALL` lists H1+X; empty register 200 | Missing param 500; UI “All schedules” unusable | No | fixed-in-tree |
| P0-04 | MED0001 | Unmapped pharmacy paths | Structured 404 `NOT_FOUND` | `GET /pharmacy/staff\|customers\|notifications` → 500 | No | fixed-in-tree |
| P0-05 | MED0001 | `GET /pharmacy/orders` has no list | 405 until inbox exists, never 500 | Live 500 `INTERNAL_ERROR` | No | fixed-in-tree |
| P0-06 | MED0001 | Analytics on FREE | 403 `PLAN_UPGRADE_REQUIRED` | Live 500 (CRM lookup or unhandled throw) | No | fixed-in-tree |
| P0-07 | MED0002 | Login AC-002 field leak | Generic INVALID_CREDENTIALS copy | Host forwards “Password does not match” | No | fixed-in-tree |
| P0-08 | MED0002 | Drug-register host omits `schedule` | Always send `H1`, `X`, or `ALL` | Empty schedule hits required Core param | No | fixed-in-tree |
| P0-09 | MED0001 | `PosDispensePort` stub | Creates a real POS cart | Returns random UUIDs (GAP-017) | No | fixed-in-tree |
| P0-10 | MED0001 | No pharmacy order inbox GET | Tenant-scoped list+detail | GAP-002; `/orders` is guidance-only | No | fixed-in-tree |
| P0-11 | MED0001 | No pharmacy staff invite/lifecycle | Invite, list, deactivate, POS PIN set | GAP-006; roles CRUD only | No | fixed-in-tree |
| P0-12 | MED0001 | OPEN Core audit X8 | Presigned PUT + quarantine for KYC/Rx | Multipart through API; Rx has no GuardDuty | **Human** (S3/GuardDuty) | human — see Human notes |
| P0-13 | MED0001 | OPEN Core audit X9/X30 | Prod boot rejects `replace_me`; live SMS/push | Placeholder comms secrets; Twilio absent | **Human** (secrets) | human |
| P0-14 | MED0001 | OPEN Core audit R5 | PITR drill RPO≤15m / RTO≤60m | Unproven | **Human** (ops drill) | human — see Human notes |
| P0-15 | MED0001 | OPEN Core audit R11 | Live notification delivery proof | Vendor adapters incomplete | **Human** (MSG91/FCM) | human |
| P0-16 | MED0001 | X28/R18 SaaS Cashfree | Live subscribe+webhook or keep fail-closed and hide Pay | Fail-closed adapter | **Human** (Cashfree keys) *or* hide Pay CTA | fixed-in-tree (Pay hidden unless `VITE_SAAS_PAYMENTS_ENABLED=true`) |
| P0-17 | MED0002 infra | Production CloudFront headers | Same HSTS/XFO/nosniff/CSP as staging | `pharmacy.nammamedmate.com` GET has none | **Human** (terraform apply) | human — dispatch `terraform.yml` production apply |
| P0-18 | Both | Tracker honesty | 0 stories `production-ready` until D2 | All labeled `staging-deployed` | No (docs after deploys) | open |
| P0-19 | QA | Second pharmacy + staff role | Owner vs staff vs cashier proven | Only one owner account | **Human** (provision roles) | human — see Human notes |
| P0-20 | MED0001 | Pharmacy password policy vs login | Register policy enforced on set; login generic | Weak existing hashes still login (expected) | No — do not lock out live owner | wont-fix-here |

---

## P1 — incorrect contracts / incomplete features

| ID | Repo | Defect | Fix | Human? | Status |
| --- | --- | --- | --- | --- | --- |
| P1-01 | MED0003 | `/orders` is EmptyState only | Keep until P0-10; then list UI | No | fixed-in-tree |
| P1-02 | MED0001 | Rider assign is UUID-only | GAP-003 directory or keep UUID + 404 copy | No | fixed-in-tree |
| P1-03 | MED0001 | No pharmacy customer/CRM APIs | GAP-004/005 — do not invent from admin CRM | No | fixed-in-tree (POS customer directory; campaigns still GAP-005) |
| P1-04 | MED0001 | No notification inbox | GAP-011 | No | fixed-in-tree |
| P1-05 | MED0001 | No support ticket list | GAP-012; id-in-hand only | No | fixed-in-tree |
| P1-06 | MED0001 | No pickup OTP / handoff | GAP-019 | No | fixed-in-tree |
| P1-07 | MED0001 | POS barcode/loose semantics | GAP-020 document or implement | No | open |
| P1-08 | MED0001 | Dashboard KPI aggregate | GAP-001 | No | fixed-in-tree |
| P1-09 | MED0001 | ACTIVE shop with 0/5 KYC | Enforce submit-before-activate or force KYC gate in portal | No | wont-fix-here — admin discretion |
| P1-10 | MED0002 | Default Playwright ignores federation | `pnpm test:e2e` must run remotes or CI must run both configs | No | fixed-in-tree |
| P1-11 | MED0001 | Forgot-password for pharmacy | Portal forbids inventing; Core has admin reset only | No | fixed-in-tree (email/SMS still human) |
| P1-12 | MED0001 | Analytics 500 if `crm_account` missing | Treat missing account as FREE + 403, never 500 | No | fixed-in-tree |
| P1-13 | MED0002 | Host `isOwner` vs Core `owner` | Already mapped in `mapPharmacyRole`; keep tests | No | fixed-in-tree |
| P1-14 | MED0003 | README lag (billing khata/offers, settings roles) | Update READMEs | No | fixed-in-tree |

---

## P2 — expected for a real pharmacy, not in current stories

| ID | Need | Priority note | Human? | Status |
| --- | --- | --- | --- | --- |
| P2-01 | POS returns / credit notes | Standard ERP | No | fixed-in-tree |
| P2-02 | Insurance/TPA claim after POS radio | Radio exists; no claim API | No | fixed-in-tree |
| P2-03 | Pharmacy-side refill reminders | Core EPIC-018 is customer-only | No | open |
| P2-04 | Supplier RTV | GRN in, no return-to-vendor | No | fixed-in-tree |
| P2-05 | Multi-branch rollups | GAP-016 | No | fixed-in-tree |
| P2-06 | E-invoice IRN | GAP-013; keep fail-closed | **Human** (GSP) | human |
| P2-07 | Tally/Zoho | GAP-023 | **Human** | human |
| P2-08 | Customer app + Admin HQ UI | Four-sided platform; Admin folder empty | Separate repos | human |

---

## Conflicts (do not silently pick)

1. Source PDFs vs Core DTOs → **Core wins** (already in SOURCE-TRACEABILITY).
2. Core STORY-002 documents `Password does not match`; portal AC-002 forbids field reveal → **portal generic copy**; do not change Bruno unless Core story is amended.
3. Core INDEX still says Draft; tracker says staging-deployed → tracker is SoT for status, INDEX is stale.
4. P021-004 AC-008 said tracker stays pending → obsolete after implementation.
5. P021-002 WCAG on named screens vs default e2e with remotes off → P1-10.

---

## Human-only (do not block code work)

- Replace `replace_me` comms/payment secrets in AWS SM. Leave as-is this pass.
- MSG91 / FCM / Cashfree live proofs. Leave as-is this pass.
- GSP e-invoice / Tally. Leave as-is this pass.
- **P0-17 Terraform apply (production CloudFront headers):** policy already lives in `infra/modules/edge-security`. Staging auto-apply does not touch production. Dispatch [failed](https://github.com/Iamreyansh/MED0002_PharmacyPortal/actions/runs/33373960604): plan had 2 IAM role-policy replace/destroy actions, and the workflow guard requires `allow_destroy=true` after review. After reviewing `module.deploy_role` / `module.terraform_apply_role` replacements: `gh workflow run terraform.yml -f environment=production -f action=apply -f allow_destroy=true`. Keep CSP report-only until federation is confirmed on prod. Do not fail nightly smoke on missing headers until apply lands.
- **P0-14 PITR drill:** Point-in-Time Recovery on RDS. Ops restores a snapshot/PITR to a *scratch* instance and proves RPO ≤ 15 min and RTO ≤ 60 min. Not application code. Runbook: Core `docs/runbooks/STAGING-PRODUCTION-PROMOTION.md` (audit R5).
- **P0-12 S3/GuardDuty for KYC/Rx (recommended):** stop proxying bytes through the API JVM. Use two-step **presigned PUT** (`PresignedUrlService.createPutUrl`) then confirm. Keys: `kyc/{pharmacyId}/…` and `prescriptions/{pharmacyId}/…`. Quarantine the object until GuardDuty Malware Protection on that prefix is clean; only then mark the document submitted. Infra already scopes GuardDuty to the KYC prefix — add the same for Rx. Never put bucket credentials in `VITE_*`.
- **P0-19 Second pharmacy + RBAC sign-off:** staff APIs exist (`POST /api/v1/pharmacy/staff` invite, `POST /api/v1/auth/pharmacy/complete-invite`). Cannot invite a second `owner`. Provision: (1) register or clone a second pharmacy tenant in staging/prod, (2) owner invites `pharmacist` / `cashier` and completes invite once (token shown once), (3) set POS PIN, (4) prove owner vs staff vs cashier on Roles, POS, and staff:manage. Optional: `POST /api/v1/auth/pharmacy/switch-pharmacy` with two assignments. This workspace cannot create the second live tenant.
- Rotate the audit mailbox password; never commit it.

---

## Implementation log

| Date | IDs | Change |
| --- | --- | --- |
| 2026-08-31 | P0-01…P0-08, P1-12 | Started in this session (see git diffs in MED0001 + MED0002) |
| 2026-08-31 | P0-09…P0-11, P0-16, P1-01, P1-10, P1-14 | POS cart bridge, order inbox GET, staff lifecycle, hide Pay, federation CI, READMEs |
| 2026-08-31 | P1-02…P1-06, P1-08, P1-11, P2-01/02/04/05 | Rider directory, customers, notices, ticket list, pickup OTP, dashboard KPIs, pharmacy forgot/reset, POS returns/TPA/RTV/rollup |
