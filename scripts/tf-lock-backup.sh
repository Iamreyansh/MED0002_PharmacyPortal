#!/usr/bin/env bash
set -euo pipefail

BUCKET="${TF_STATE_BUCKET:-terraform-locks-105927215604}"
KEY_PREFIX="${TF_LOCK_PREFIX:-MED0002}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK_FILE="${ROOT}/infra/.terraform.lock.hcl"

if [ ! -f "$LOCK_FILE" ]; then
  echo "Missing ${LOCK_FILE}" >&2
  exit 1
fi

DEST="s3://${BUCKET}/${KEY_PREFIX}/.terraform.lock.hcl"
echo "Uploading provider lock to ${DEST}"
aws s3 cp "$LOCK_FILE" "$DEST" --only-show-errors
echo "Lockfile backup complete."
