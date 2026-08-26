# Personas, RBAC, and Plan Matrix

## Actors

- `pharmacy_owner`: tenant owner. May use owner-only mutations shown in each story endpoint table.
- `pharmacy_staff`: assigned tenant staff. May read or mutate only where Core permits the role or an assigned permission such as `staff:manage`.
- POS token: restricted to POS-scoped APIs. A rejection outside that scope uses `POS_TOKEN_RESTRICTED`.
- Customer, rider, admin, and support-agent roles are not pharmacy portal personas.

## Authorization rules

1. Core resolves the active pharmacy from the authenticated subject/session. The UI does not send a user-selected tenant id unless the implemented DTO requires it.
2. Owner-only actions remain hidden or disabled for staff, while `403` remains recoverable because server policy is authoritative.
3. Ticket CSAT and reopen are creator-only under the implemented subject comparison; pharmacy tenancy alone is insufficient.
4. Pharmacy order assignment uses Core's owner/staff tenant check. The portal does not claim an `orders:dispatch` permission that Core does not enforce.

## Plans and modules

Runtime plan codes are `FREE`, `STARTER`, `RETAIL_PRO`, and `ENTERPRISE`. Story metadata states the minimum plan, but the current subscription/module response overrides static marketing copy. `MODULE_NOT_IN_PLAN` represents a disabled module; a service may additionally return its stable feature-tier error. The statutory drug register is available on Free and above.
