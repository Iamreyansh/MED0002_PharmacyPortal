# Error and Recovery Catalog

Stories list the stable Core error codes relevant to each endpoint. UI handling is code-based, never message-string matching.

- Authentication: refresh-token invalid/expired/reused ends or safely re-establishes the session as specified by the auth stories.
- Authorization: `FORBIDDEN`, owner/staff-specific codes, and `POS_TOKEN_RESTRICTED` show a permission state without an upgrade CTA.
- Commercial access: `MODULE_NOT_IN_PLAN` and documented plan/feature codes show the current runtime upgrade or contact-owner path.
- Validation: preserve server field details, focus the first invalid control, and retain non-secret input.
- Resource/state: stable resource-specific not-found codes and transition conflicts refresh context before another mutation.
- Transient transport/5xx: preserve confirmed data, provide a bounded retry for safe reads, and never duplicate a mutation.

Unknown codes use a generic correlation-safe failure state and telemetry without exposing stack traces, tokens, PII, or request bodies.
