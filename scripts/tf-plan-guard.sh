#!/usr/bin/env bash
# Fail a terraform plan that would destroy protected resource types.
set -euo pipefail

PLAN_FILE="${1:?usage: tf-plan-guard.sh <tfplan>}"
ALLOW_DESTROY="${TF_ALLOW_DESTROY:-false}"
PLAN_DIR="$(cd "$(dirname "${PLAN_FILE}")" && pwd)"
PLAN_BASE="$(basename "${PLAN_FILE}")"

if ! command -v jq >/dev/null 2>&1; then
  echo "::error::jq is required for terraform plan guards" >&2
  exit 1
fi

SHOW="$(cd "${PLAN_DIR}" && terraform show -json "${PLAN_BASE}")"
CHANGES="$(echo "${SHOW}" | jq -c '
  (.resource_changes // [])
  | map(select(.change.actions | index("delete") or index("replace")))
')"
DELETE_COUNT="$(echo "${CHANGES}" | jq 'length')"

echo "Plan guard: ${DELETE_COUNT} destroy/replace action(s)"
echo "${CHANGES}" | jq -r '
  .[] | "\(.address) \(.change.actions | join(","))"
'

if [ "${DELETE_COUNT}" = "0" ]; then
  exit 0
fi

PROTECTED="$(echo "${CHANGES}" | jq -r '
  .[]
  | select(
      .type == "aws_cloudfront_distribution"
      or .type == "aws_s3_bucket"
      or .type == "aws_route53_record"
      or .type == "aws_acm_certificate"
    )
  | .address
')"

if [ -n "${PROTECTED}" ] && [ "${ALLOW_DESTROY}" != "true" ]; then
  echo "::error::Plan would destroy or replace protected resources:" >&2
  echo "${PROTECTED}" >&2
  echo "Set TF_ALLOW_DESTROY=true only for an intentional break-glass apply." >&2
  exit 1
fi

if [ "${ALLOW_DESTROY}" != "true" ]; then
  echo "::error::Plan contains destroy/replace. Re-run with TF_ALLOW_DESTROY=true after review." >&2
  exit 1
fi

echo "TF_ALLOW_DESTROY=true; continuing with reviewed destroy/replace."
