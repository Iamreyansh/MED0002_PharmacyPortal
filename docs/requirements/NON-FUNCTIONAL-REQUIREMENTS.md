# Non-Functional Requirements

## Security and privacy

Tokens remain in the host-controlled session boundary; MFEs receive minimum data. No secrets, health data, financial identifiers, or request bodies enter logs or analytics. Server authorization is mandatory for every operation.

## Reliability

Reads have finite timeouts, cancellation, and bounded retries. Mutations are not automatically replayed unless the endpoint's idempotency contract makes that safe. A failed remote is isolated by an error boundary and does not take down host navigation.

## Performance

Keep the shell and route manifests cacheable, lazy-load domain MFEs, paginate server data, and avoid unbounded client joins. Measure route readiness and Core latency separately; do not hide slow APIs behind indefinite spinners.

## Compatibility and observability

Support current evergreen desktop/mobile browsers. Emit correlation-safe route, contract, remote-load, and recovery telemetry without PII. Release checks cover contract drift, accessibility, security headers, bundle budgets, and critical end-to-end journeys.
