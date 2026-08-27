#!/usr/bin/env bash
# Sync a built dist to an environment bucket and invalidate CloudFront.
set -euo pipefail

BUCKET="${1:?bucket}"
DIST="${2:?dist dir}"
SHA="${3:?git sha}"
DISTRIBUTION_ID="${4:?cloudfront id}"
RUNTIME_CONFIG="${5:?runtime-config.json}"

aws s3 sync "${DIST}/" "s3://${BUCKET}/releases/${SHA}/" \
  --delete \
  --only-show-errors \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "runtime-config.json"

aws s3 sync "${DIST}/" "s3://${BUCKET}/" \
  --delete \
  --only-show-errors \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html" \
  --exclude "*.json" \
  --exclude "releases/*"

aws s3 sync "${DIST}/" "s3://${BUCKET}/" \
  --only-show-errors \
  --cache-control "public,max-age=0,must-revalidate" \
  --exclude "*" \
  --include "index.html" \
  --include "*.json" \
  --exclude "runtime-config.json"

aws s3 cp "${RUNTIME_CONFIG}" "s3://${BUCKET}/releases/${SHA}/runtime-config.json" \
  --only-show-errors \
  --cache-control "public,max-age=0,must-revalidate" \
  --content-type "application/json"

aws s3 cp "${RUNTIME_CONFIG}" "s3://${BUCKET}/runtime-config.json" \
  --only-show-errors \
  --cache-control "public,max-age=0,must-revalidate" \
  --content-type "application/json"

INVALIDATION_ID="$(
  aws cloudfront create-invalidation \
    --distribution-id "${DISTRIBUTION_ID}" \
    --paths "/index.html" "/runtime-config.json" "/" \
    --query 'Invalidation.Id' \
    --output text \
    --no-cli-pager
)"
echo "Submitted CloudFront invalidation ${INVALIDATION_ID}"
