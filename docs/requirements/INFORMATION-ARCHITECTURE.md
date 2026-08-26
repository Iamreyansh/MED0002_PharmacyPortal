# Information Architecture

The host provides authenticated chrome and mounts domain MFEs by route. Navigation is derived from the current actor, pharmacy lifecycle, endpoint permission, and runtime module/plan response; a hidden link is never an authorization boundary.

## Route registry

| Route | Story | Screen owner | Minimum plan |
| --- | --- | --- | --- |
| `*` | STORY-P001-003 | host | FREE+ |
| `*` | STORY-P003-006 | host | FREE+ |
| `*` | STORY-P007-004 | host | FREE+ |
| `*` | STORY-P021-001 | host | FREE+ |
| `*` | STORY-P021-002 | host | FREE+ |
| `*` | STORY-P021-003 | host | FREE+ |
| `*` | STORY-P021-004 | host | FREE+ |
| `/` | STORY-P001-001 | host | FREE+ |
| `/` | STORY-P001-002 | host | FREE+ |
| `/` | STORY-P003-002 | mfe-auth | FREE+ |
| `/` | STORY-P003-004 | host | FREE+ |
| `/analytics` | STORY-P017-001 | mfe-analytics | RETAIL_PRO+ |
| `/analytics` | STORY-P017-002 | mfe-analytics | RETAIL_PRO+ |
| `/analytics` | STORY-P017-003 | mfe-analytics | RETAIL_PRO+ |
| `/billing` | STORY-P007-003 | mfe-subscription | FREE+ |
| `/catalogue/mapping` | STORY-P008-002 | mfe-catalogue | FREE+ |
| `/catalogue` | STORY-P008-001 | mfe-catalogue | FREE+ |
| `/compliance/drug-register` | STORY-P014-004 | mfe-rx | FREE+ |
| `/distributors` | STORY-P010-003 | mfe-procurement | RETAIL_PRO+ |
| `/finance/settlements/:id` | STORY-P016-002 | mfe-finance | FREE+ |
| `/finance/settlements` | STORY-P016-001 | mfe-finance | FREE+ |
| `/help/articles/:id` | STORY-P019-004 | mfe-support | FREE+ |
| `/help` | STORY-P019-004 | mfe-support | FREE+ |
| `/inventory/:productId` | STORY-P009-001 | mfe-inventory | FREE+ |
| `/inventory/:productId` | STORY-P009-002 | mfe-inventory | FREE+ |
| `/inventory/:productId` | STORY-P009-004 | mfe-inventory | RETAIL_PRO+ |
| `/inventory/expiry` | STORY-P009-002 | mfe-inventory | FREE+ |
| `/inventory` | STORY-P009-001 | mfe-inventory | FREE+ |
| `/invoice-settings` | STORY-P012-002 | mfe-billing | FREE+ |
| `/invoices/:invoiceId` | STORY-P012-001 | mfe-billing | FREE+ |
| `/invoices` | STORY-P012-001 | mfe-billing | FREE+ |
| `/khata/:customerId` | STORY-P013-001 | mfe-billing | STARTER+ |
| `/khata/:customerId` | STORY-P013-002 | mfe-billing | STARTER+ |
| `/khata` | STORY-P013-001 | mfe-billing | STARTER+ |
| `/login` | STORY-P003-001 | mfe-auth | FREE+ |
| `/offers` | STORY-P013-003 | mfe-billing | RETAIL_PRO+ |
| `/onboarding/kyc` | STORY-P004-004 | mfe-onboarding | FREE+ |
| `/onboarding/status` | STORY-P004-003 | mfe-onboarding | FREE+ |
| `/orders/:orderId` | STORY-P015-002 | mfe-orders | FREE+ |
| `/orders/:orderId` | STORY-P015-003 | mfe-orders | FREE+ |
| `/orders/:orderId` | STORY-P015-004 | mfe-orders | FREE+ |
| `/pos-login` | STORY-P003-005 | mfe-auth | FREE+ |
| `/pos` | STORY-P003-005 | mfe-auth | FREE+ |
| `/pos` | STORY-P011-001 | mfe-pos | FREE+ |
| `/pos` | STORY-P011-002 | mfe-pos | FREE+ |
| `/pos` | STORY-P011-003 | mfe-pos | FREE+ |
| `/pos` | STORY-P011-004 | mfe-pos | FREE+ |
| `/pos` | STORY-P014-003 | mfe-rx | STARTER+ |
| `/prescriptions/:rxId` | STORY-P014-001 | mfe-rx | STARTER+ |
| `/prescriptions/:rxId` | STORY-P014-002 | mfe-rx | STARTER+ |
| `/prescriptions/:rxId` | STORY-P014-003 | mfe-rx | STARTER+ |
| `/prescriptions` | STORY-P014-001 | mfe-rx | STARTER+ |
| `/purchases/:grnId` | STORY-P010-001 | mfe-procurement | FREE+ |
| `/purchases` | STORY-P010-001 | mfe-procurement | FREE+ |
| `/purchases` | STORY-P010-002 | mfe-procurement | FREE+ |
| `/racks` | STORY-P009-003 | mfe-inventory | FREE+ |
| `/register/verify` | STORY-P004-002 | mfe-onboarding | FREE+ |
| `/register` | STORY-P004-001 | mfe-onboarding | FREE+ |
| `/reorder` | STORY-P010-004 | mfe-procurement | RETAIL_PRO+ |
| `/rx-quotes` | STORY-P015-001 | mfe-orders | FREE+ |
| `/sales` | STORY-P012-003 | mfe-billing | FREE+ |
| `/sales` | STORY-P012-004 | mfe-billing | FREE+ |
| `/sessions` | STORY-P003-003 | mfe-auth | FREE+ |
| `/settings/notifications` | STORY-P018-001 | mfe-settings | FREE+ |
| `/settings/profile` | STORY-P005-001 | mfe-settings | FREE+ |
| `/settings/profile` | STORY-P005-002 | mfe-settings | FREE+ |
| `/settings/roles` | STORY-P006-001 | mfe-settings | FREE+ |
| `/settings/roles` | STORY-P006-002 | mfe-settings | FREE+ |
| `/settings/storefront` | STORY-P005-003 | mfe-settings | FREE+ |
| `/subscription` | STORY-P007-001 | mfe-subscription | FREE+ |
| `/subscription` | STORY-P007-002 | mfe-subscription | FREE+ |
| `/support/new` | STORY-P019-001 | mfe-support | FREE+ |
| `/support/tickets/:id` | STORY-P019-001 | mfe-support | FREE+ |
| `/support/tickets/:id` | STORY-P019-002 | mfe-support | FREE+ |
| `/todos` | STORY-P001-004 | host | FREE+ |

## Navigation rules

- Group routes by Counter, Stock, Fulfilment, Money, Engagement, and Settings according to the owning epic.
- Preserve deep links through login and pharmacy switching only after the destination guard succeeds.
- Do not add routes for capabilities in `BACKEND-CAPABILITY-GAPS.md`.
- Mobile and desktop navigation expose the same authorized destinations.
