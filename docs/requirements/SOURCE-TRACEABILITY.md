# Source Traceability

The source PDFs describe the desired product. Core controllers/DTOs and Bruno requests determine whether a portal story is implementable now.

| Source capability | Primary source | Portal epic(s) | Disposition |
| --- | --- | --- | --- |
| Portal shell and dashboard navigation | Pharmacy Dashboard pp. 2–3 | P001, P003 | Implemented backlog; live KPI aggregate remains a backend gap |
| Registration, KYC, profile, storefront | Customer App p. 9; Pharmacy Dashboard pp. 7–9; Admin HQ pp. 2–3 | P004, P005 | Implemented Core contracts |
| Plans, feature locks, SaaS billing | Pharmacy Dashboard pp. 2, 8–9; Admin HQ pp. 4–6 | P001, P007 | Runtime Core plan catalogue overrides marketing conflicts |
| Catalogue, inventory, batches, racks | Pharmacy Dashboard pp. 5–6; Admin HQ p. 6 | P008, P009 | Implemented Core contracts |
| Purchases, distributors, reorder | Pharmacy Dashboard pp. 5–6 | P010 | Implemented Core contracts |
| POS, GST invoices, sales ledger | Pharmacy Dashboard pp. 2–4, 7–8 | P011, P012 | Implemented subset; scanner/loose semantics remain a gap |
| Khata and local offers | Pharmacy Dashboard pp. 4, 6 | P013 | Implemented Core contracts; pharmacy offers are not platform coupons |
| Prescription review and statutory register | Pharmacy Dashboard pp. 3–4; Admin HQ p. 6 | P014 | Implemented workflow subset; KPI/insight aggregate remains a gap |
| Rx quote and marketplace order fulfilment | Customer App pp. 3–6; Pharmacy Dashboard pp. 2–3 | P015 | Quotes listable; orders are id-in-hand actions |
| Settlements and finance visibility | Pharmacy Dashboard p. 7; Admin HQ pp. 3, 6–7 | P016 | Read-only pharmacy settlement history |
| Analytics and reports | Pharmacy Dashboard p. 7 | P017 | Implemented Core analytics subset |
| Notifications and support | Pharmacy Dashboard pp. 2, 9; Admin HQ p. 8 | P018, P019 | Preferences/device token and ticket-by-id only; no inbox |
| Accounting integration | Autonomous Blueprint p. 5; Pharmacy Dashboard p. 7 | — | Deferred backend capability; no implemented controller |
| Autonomous pharmacy operations | Autonomous Blueprint pp. 3–5 | — | Backend/Admin responsibility |
| Hospital/IPD, kiosk, employees, CRM patients, pharmacy disputes | Pharmacy Dashboard pp. 4, 6, 8–9 | — | Excluded until Core exposes pharmacy-facing APIs |

## Story-level traceability

| Story | Epic | Product source / enabling requirement | Implemented Core reference |
| --- | --- | --- | --- |
| STORY-P001-001 | EPIC-P001 | Pharmacy Dashboard §1–2 | n/a — host only |
| STORY-P001-002 | EPIC-P001 | Pharmacy Dashboard §1–2 | EPIC-001 STORY-005, EPIC-014 STORY-001 |
| STORY-P001-003 | EPIC-P001 | Pharmacy Dashboard §1–2 | MED0003 data-contract.md |
| STORY-P001-004 | EPIC-P001 | Pharmacy Dashboard §1–2 | n/a |
| STORY-P002-001 | EPIC-P002 | Core API conventions; portal API integration requirement | INDEX.md envelopes |
| STORY-P002-002 | EPIC-P002 | Core API conventions; portal API integration requirement | EPIC-001 STORY-004 |
| STORY-P002-003 | EPIC-P002 | Core API conventions; portal API integration requirement | Reliability rules, EPIC-001 |
| STORY-P003-001 | EPIC-P003 | Pharmacy Dashboard §23; Core EPIC-001 | EPIC-001 STORY-002 |
| STORY-P003-002 | EPIC-P003 | Pharmacy Dashboard §23; Core EPIC-001 | EPIC-001 STORY-004 |
| STORY-P003-003 | EPIC-P003 | Pharmacy Dashboard §23; Core EPIC-001 | EPIC-001 STORY-004 |
| STORY-P003-004 | EPIC-P003 | Pharmacy Dashboard §23; Core EPIC-001 | EPIC-001 STORY-002 |
| STORY-P003-005 | EPIC-P003 | Pharmacy Dashboard §23; Core EPIC-001 | EPIC-001 STORY-002, PosTokenRestrictionFilter |
| STORY-P003-006 | EPIC-P003 | Pharmacy Dashboard §23; Core EPIC-001 | EPIC-003 STORY-001 |
| STORY-P004-001 | EPIC-P004 | Customer App §14; Pharmacy Dashboard §21; Admin HQ §4 | EPIC-003 STORY-001 |
| STORY-P004-002 | EPIC-P004 | Customer App §14; Pharmacy Dashboard §21; Admin HQ §4 | EPIC-003 STORY-001 |
| STORY-P004-003 | EPIC-P004 | Customer App §14; Pharmacy Dashboard §21; Admin HQ §4 | EPIC-003 STORY-001 |
| STORY-P004-004 | EPIC-P004 | Customer App §14; Pharmacy Dashboard §21; Admin HQ §4 | EPIC-003 STORY-002 |
| STORY-P005-001 | EPIC-P005 | Pharmacy Dashboard §15, §21, §26; Admin HQ §4 | EPIC-003 STORY-005 |
| STORY-P005-002 | EPIC-P005 | Pharmacy Dashboard §15, §21, §26; Admin HQ §4 | EPIC-003 STORY-005 |
| STORY-P005-003 | EPIC-P005 | Pharmacy Dashboard §15, §21, §26; Admin HQ §4 | EPIC-004 STORY-004 |
| STORY-P006-001 | EPIC-P006 | Pharmacy Dashboard §23 | EPIC-001 STORY-005 |
| STORY-P006-002 | EPIC-P006 | Pharmacy Dashboard §23 | EPIC-001 STORY-005 |
| STORY-P006-003 | EPIC-P006 | Pharmacy Dashboard §23 | EPIC-001 STORY-005 |
| STORY-P007-001 | EPIC-P007 | Pharmacy Dashboard §25, §28; Admin HQ §7 | EPIC-014 STORY-001 |
| STORY-P007-002 | EPIC-P007 | Pharmacy Dashboard §25, §28; Admin HQ §7 | EPIC-014 STORY-002 |
| STORY-P007-003 | EPIC-P007 | Pharmacy Dashboard §25, §28; Admin HQ §7 | EPIC-014 STORY-003 |
| STORY-P007-004 | EPIC-P007 | Pharmacy Dashboard §25, §28; Admin HQ §7 | EPIC-014, service gates |
| STORY-P008-001 | EPIC-P008 | Pharmacy Dashboard §10, §15; Admin HQ §8 | EPIC-005 STORY-003 |
| STORY-P008-002 | EPIC-P008 | Pharmacy Dashboard §10, §15; Admin HQ §8 | EPIC-005 STORY-005 |
| STORY-P009-001 | EPIC-P009 | Pharmacy Dashboard §10–11 | EPIC-006 STORY-001 |
| STORY-P009-002 | EPIC-P009 | Pharmacy Dashboard §10–11 | EPIC-006 STORY-002 |
| STORY-P009-003 | EPIC-P009 | Pharmacy Dashboard §10–11 | EPIC-006 STORY-003 |
| STORY-P009-004 | EPIC-P009 | Pharmacy Dashboard §10–11 | EPIC-006 STORY-001 |
| STORY-P010-001 | EPIC-P010 | Pharmacy Dashboard §12–14 | EPIC-006 STORY-004 |
| STORY-P010-002 | EPIC-P010 | Pharmacy Dashboard §12–14 | EPIC-006 STORY-004 |
| STORY-P010-003 | EPIC-P010 | Pharmacy Dashboard §12–14 | EPIC-006 STORY-005 |
| STORY-P010-004 | EPIC-P010 | Pharmacy Dashboard §12–14 | EPIC-006 STORY-006 |
| STORY-P011-001 | EPIC-P011 | Pharmacy Dashboard §3 | EPIC-007 STORY-001 |
| STORY-P011-002 | EPIC-P011 | Pharmacy Dashboard §3 | EPIC-007 STORY-001 |
| STORY-P011-003 | EPIC-P011 | Pharmacy Dashboard §3 | EPIC-007 STORY-001 |
| STORY-P011-004 | EPIC-P011 | Pharmacy Dashboard §3 | PosTokenRestrictionFilter |
| STORY-P012-001 | EPIC-P012 | Pharmacy Dashboard §3–5, §24 | EPIC-007 STORY-002 |
| STORY-P012-002 | EPIC-P012 | Pharmacy Dashboard §3–5, §24 | EPIC-007 STORY-002 |
| STORY-P012-003 | EPIC-P012 | Pharmacy Dashboard §3–5, §24 | EPIC-007 STORY-004 |
| STORY-P012-004 | EPIC-P012 | Pharmacy Dashboard §3–5, §24 | EPIC-007 STORY-004 |
| STORY-P013-001 | EPIC-P013 | Pharmacy Dashboard §8, §16 | EPIC-007 STORY-003 |
| STORY-P013-002 | EPIC-P013 | Pharmacy Dashboard §8, §16 | EPIC-007 STORY-003 |
| STORY-P013-003 | EPIC-P013 | Pharmacy Dashboard §8, §16 | EPIC-007 STORY-005 |
| STORY-P014-001 | EPIC-P014 | Pharmacy Dashboard §6; Admin HQ §9 | EPIC-008 STORY-002 |
| STORY-P014-002 | EPIC-P014 | Pharmacy Dashboard §6; Admin HQ §9 | EPIC-008 STORY-002 |
| STORY-P014-003 | EPIC-P014 | Pharmacy Dashboard §6; Admin HQ §9 | EPIC-008 STORY-002 |
| STORY-P014-004 | EPIC-P014 | Pharmacy Dashboard §6; Admin HQ §9 | EPIC-008 STORY-004 |
| STORY-P015-001 | EPIC-P015 | Pharmacy Dashboard §4; Customer App §6, §8 | EPIC-010 STORY-003 |
| STORY-P015-002 | EPIC-P015 | Pharmacy Dashboard §4; Customer App §6, §8 | OrderStateMachine |
| STORY-P015-003 | EPIC-P015 | Pharmacy Dashboard §4; Customer App §6, §8 | OrderStateMachine |
| STORY-P015-004 | EPIC-P015 | Pharmacy Dashboard §4; Customer App §6, §8 | EPIC-010 pharmacy assign-rider |
| STORY-P016-001 | EPIC-P016 | Pharmacy Dashboard §21; Admin HQ §4, §10 | EPIC-012 STORY-003 |
| STORY-P016-002 | EPIC-P016 | Pharmacy Dashboard §21; Admin HQ §4, §10 | EPIC-012 STORY-003 |
| STORY-P017-001 | EPIC-P017 | Pharmacy Dashboard §18 | EPIC-016 STORY-004 |
| STORY-P017-002 | EPIC-P017 | Pharmacy Dashboard §18 | EPIC-016 STORY-004 |
| STORY-P017-003 | EPIC-P017 | Pharmacy Dashboard §18 | EPIC-016 STORY-004 |
| STORY-P018-001 | EPIC-P018 | Pharmacy Dashboard §1, §26 | EPIC-017 STORY-005 |
| STORY-P018-002 | EPIC-P018 | Pharmacy Dashboard §1, §26 | EPIC-017 STORY-001 |
| STORY-P019-001 | EPIC-P019 | Pharmacy Dashboard §26; Admin HQ §13 | EPIC-015 STORY-001 |
| STORY-P019-002 | EPIC-P019 | Pharmacy Dashboard §26; Admin HQ §13 | EPIC-015 STORY-001 |
| STORY-P019-004 | EPIC-P019 | Pharmacy Dashboard §26; Admin HQ §13 | EPIC-015 STORY-003 PublicHelpController |
| STORY-P021-001 | EPIC-P021 | Cross-document NFRs; portal release requirements | multiple |
| STORY-P021-002 | EPIC-P021 | Cross-document NFRs; portal release requirements | NFR |
| STORY-P021-003 | EPIC-P021 | Cross-document NFRs; portal release requirements | ERROR-AND-RECOVERY-CATALOG.md |
| STORY-P021-004 | EPIC-P021 | Cross-document NFRs; portal release requirements | n/a |

## Conflict decisions

1. API role, plan, status, endpoint, and DTO values from implemented Core override marketing/demo copy in the PDFs.
2. Runtime plan codes are `FREE`, `STARTER`, `RETAIL_PRO`, `ENTERPRISE`; UI labels are Free, Starter, Growth, Pro.
3. The portal does not recreate Admin HQ controls. It only exposes pharmacy-owner/staff workflows.
4. The Autonomous Operations Blueprint primarily specifies backend/admin automation. Portal requirements cover safe visibility of automated outcomes and recovery, not a pharmacy rule builder.
5. The two blueprint files are duplicate copies; no requirement is counted twice.
