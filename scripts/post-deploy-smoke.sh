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

smoke_core_json() {
  local api_base="$1"
  local target="${api_base}/api/v1/auth/me"
  echo "Smoke: ${target}"
  local code
  code="$(curl -sS --retry 8 --retry-delay 3 --retry-all-errors -o /tmp/portal-api-me.json -w '%{http_code}' "${target}" || true)"
  if [ "${code}" = "200" ]; then
    if grep -qiE 'DOCTYPE|Pharmacy Portal' /tmp/portal-api-me.json; then
      echo "::error::${target} returned SPA HTML; Core origin is wrong" >&2
      exit 1
    fi
    echo "OK ${target} HTTP 200 (JSON)"
  elif [ "${code}" = "401" ] || [ "${code}" = "403" ]; then
    echo "OK ${target} HTTP ${code} (Core reachable)"
  else
    echo "::error::${target} returned HTTP ${code}" >&2
    exit 1
  fi
}

smoke_core_preflight() {
  local api_base="$1"
  local target="${api_base}/api/v1/auth/me"
  echo "Smoke: OPTIONS ${target}"
  local code
  code="$(
    curl -sS --retry 8 --retry-delay 3 --retry-all-errors \
      -D /tmp/portal-api-opt.h -o /dev/null -w '%{http_code}' \
      -X OPTIONS "${target}" \
      -H "Origin: ${ORIGIN}" \
      -H "Access-Control-Request-Method: GET" \
      -H "Access-Control-Request-Headers: authorization" || true
  )"
  if [ "${code}" != "200" ] && [ "${code}" != "204" ]; then
    echo "::error::OPTIONS ${target} returned HTTP ${code}; Core CORS is required" >&2
    exit 1
  fi
  local acao
  acao="$(
    grep -i '^access-control-allow-origin:' /tmp/portal-api-opt.h \
      | sed -E 's/^[Aa]ccess-[Cc]ontrol-[Aa]llow-[Oo]rigin:[[:space:]]*//' \
      | tr -d '\r' \
      | tail -n 1
  )"
  if [ "${acao}" != "${ORIGIN}" ]; then
    echo "::error::OPTIONS ${target} ACAO '${acao}' did not match ${ORIGIN}" >&2
    exit 1
  fi
  echo "OK OPTIONS ${target} HTTP ${code} ACAO ${acao}"
}

smoke_legacy_api() {
  local target="${ORIGIN}/api/v1/auth/me"
  echo "Smoke: ${target} (legacy same-origin)"
  local code
  code="$(curl -sS --retry 8 --retry-delay 3 --retry-all-errors -o /tmp/portal-api-me.json -w '%{http_code}' "${target}" || true)"
  if [ "${code}" = "200" ]; then
    if grep -qiE 'DOCTYPE|Pharmacy Portal' /tmp/portal-api-me.json; then
      echo "::warning::/api/v1/auth/me returned SPA HTML; CloudFront Core origin is not applied"
    else
      echo "OK /api/v1/auth/me HTTP 200 (JSON)"
    fi
  elif [ "${code}" = "401" ] || [ "${code}" = "403" ]; then
    echo "OK /api/v1/auth/me HTTP ${code} (Core reachable)"
  else
    echo "::error::/api/v1/auth/me returned HTTP ${code}" >&2
    exit 1
  fi
}

smoke_html "/"
smoke_html "/login"
smoke_html "/register"

echo "Smoke: ${ORIGIN}/runtime-config.json"
CONFIG=""
for _ in $(seq 1 18); do
  CONFIG="$(curl -fsSL --retry 2 --retry-delay 2 --retry-all-errors "${ORIGIN}/runtime-config.json" || true)"
  if printf '%s' "${CONFIG}" | grep -q '"mfeDomainSuffix"'; then
    echo "OK runtime-config.json"
    break
  fi
  sleep 10
done
if ! printf '%s' "${CONFIG}" | grep -q '"mfeDomainSuffix"'; then
  echo "::error::runtime-config.json did not contain mfeDomainSuffix" >&2
  exit 1
fi

API_BASE="$(
  printf '%s' "${CONFIG}" | python3 -c 'import json,sys; print((json.load(sys.stdin).get("apiBaseUrl") or "").rstrip("/"))'
)"

if [ -n "${API_BASE}" ]; then
  smoke_core_json "${API_BASE}"
  smoke_core_preflight "${API_BASE}"
else
  smoke_legacy_api
fi

echo "Host smoke passed for ${ORIGIN}"
