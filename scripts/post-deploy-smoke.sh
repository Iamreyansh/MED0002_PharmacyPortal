#!/usr/bin/env bash
# Host/API smoke for Pharmacy Portal. Does not call live MFE CDNs.
set -euo pipefail

URL="${1:-https://pharmacy.nammamedmate.com/}"
ORIGIN="${URL%/}"

smoke_html() {
  local path="$1"
  local target="${ORIGIN}${path}"
  echo "Smoke: ${target}"
  local code
  code="$(curl -fsSIL --retry 8 --retry-delay 3 --retry-all-errors -o /dev/null -w '%{http_code}' "${target}")"
  if [ "${code}" != "200" ]; then
    echo "::error::${path} returned HTTP ${code}" >&2
    exit 1
  fi
  echo "OK ${target}"
}

smoke_html "/"
smoke_html "/login"
smoke_html "/register"

echo "Smoke: ${ORIGIN}/runtime-config.json"
CONFIG="$(curl -fsSL --retry 8 --retry-delay 3 --retry-all-errors "${ORIGIN}/runtime-config.json")"
echo "${CONFIG}" | grep -q '"mfeDomainSuffix"'
echo "OK runtime-config.json"

echo "Smoke: ${ORIGIN}/api/v1/auth/me"
API_CODE="$(curl -sS --retry 8 --retry-delay 3 --retry-all-errors -o /tmp/portal-api-me.json -w '%{http_code}' "${ORIGIN}/api/v1/auth/me" || true)"
if [ "${API_CODE}" = "200" ]; then
  if grep -qiE 'DOCTYPE|Pharmacy Portal' /tmp/portal-api-me.json; then
    echo "::warning::/api/v1/auth/me returned SPA HTML; CloudFront Core origin is not applied yet"
  else
    echo "OK /api/v1/auth/me HTTP 200 (JSON)"
  fi
elif [ "${API_CODE}" = "401" ] || [ "${API_CODE}" = "403" ]; then
  echo "OK /api/v1/auth/me HTTP ${API_CODE} (Core reachable)"
else
  echo "::error::/api/v1/auth/me returned HTTP ${API_CODE}" >&2
  exit 1
fi

echo "Host smoke passed for ${ORIGIN}"
