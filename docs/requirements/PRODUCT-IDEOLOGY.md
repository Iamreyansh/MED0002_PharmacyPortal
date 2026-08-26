# Product Ideology

The pharmacy portal is an operational console for pharmacy owners and staff. It should shorten safe counter, stock, fulfilment, money, compliance, and support workflows without moving business authority out of Core.

## Product principles

1. Core is authoritative for tenancy, roles, module/plan gates, lifecycle state, money, compliance, and side effects.
2. The portal uses implemented `/api/v1` contracts only. PDF-promised capabilities without a controller remain in `BACKEND-CAPABILITY-GAPS.md`.
3. MED0002 owns the host shell, authenticated API boundary, navigation, telemetry, and release acceptance. MED0003 owns domain screens.
4. Owner/staff affordances mirror the endpoint table but never replace server authorization.
5. Every workflow supports loading, empty, validation, forbidden, plan/module locked, stale, and retryable failure states where applicable.
6. No portal feature may expose secrets, cross-pharmacy data, hidden patient fields, or invented financial/compliance records.
7. Prefer a small server-backed workflow over a demo-only dashboard or a client-composed legal report.

## Explicit exclusions in this snapshot

Accounting sync/export and pharmacy-created order disputes are not buildable contracts. They are tracked as backend gaps rather than frontend stories.
