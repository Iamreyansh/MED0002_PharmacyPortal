# API Integration Contract

## Boundary

- Base path: `/api/v1`.
- MED0002 owns the authenticated API client; MFEs request data through the versioned `MfeDataEnvelope` and do not independently persist credentials.
- Use the Core success/error envelope, exact DTO field names, UUIDs, ISO-8601 UTC timestamps, and money values in paise.
- Never infer an endpoint from SecurityConfig or a Bruno placeholder. A controller/service contract is required.

## Authentication and tenancy

Attach the correct bearer token, refresh once through `/auth/refresh`, and stop/re-authenticate on stable refresh-token failure codes. Never retry mutations blindly. Core remains authoritative for active-pharmacy tenancy, role, permission, module, plan, and lifecycle checks.

## Requests

Validate only documented fields, preserve server idempotency requirements, and avoid client-generated side effects. Use finite timeouts and cancellation for superseded reads. Do not send secrets to logs, telemetry, query strings, or MFE props.

## Responses and drift

Render only fields returned by the implemented DTO. Unknown enum values use a safe fallback and telemetry; they do not unlock actions. Contract tests cover the happy envelope and stable errors listed by each story.
