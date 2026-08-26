export const TELEMETRY_SECRET_KEY =
  /token|password|authorization|bearer|refresh|email|phone|account|ifsc|pan|bank|rx|prescription|identifier|aadhaar|otp/i;

export const TELEMETRY_EVENT_ALLOWLIST = ['api_error'] as const;

export type TelemetryEventName =
  (typeof TELEMETRY_EVENT_ALLOWLIST)[number] | string;
