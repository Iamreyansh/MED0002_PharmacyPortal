#!/usr/bin/env bash
# Post-deploy smoke for the Pharmacy Portal host.
set -euo pipefail

URL="${1:-https://pharmacy.nammamedmate.com/}"
TODO_MANIFEST="${TODO_MANIFEST_URL:-https://todo.mfe.nammamedmate.com/mf-manifest.json}"
AUTH_MANIFEST="${AUTH_MANIFEST_URL:-https://auth.mfe.nammamedmate.com/mf-manifest.json}"
ONBOARDING_MANIFEST="${ONBOARDING_MANIFEST_URL:-https://onboarding.mfe.nammamedmate.com/mf-manifest.json}"
# Derive origin for /todos without trailing-slash surprises.
ORIGIN="${URL%/}"
TODOS_URL="${ORIGIN}/todos"

echo "Smoke: ${URL}"
body="$(curl -fsSL --retry 5 --retry-delay 2 --retry-all-errors "$URL")"
echo "$body" | grep -qiE 'Pharmacy Portal|DOCTYPE|root'
echo "OK ${URL}"

echo "Smoke: ${TODOS_URL}"
todos_code="$(curl -fsSIL --retry 5 --retry-delay 2 --retry-all-errors -o /dev/null -w '%{http_code}' "$TODOS_URL")"
if [ "$todos_code" != "200" ]; then
  echo "::error::/todos returned HTTP ${todos_code}" >&2
  exit 1
fi
todos_body="$(curl -fsSL --retry 5 --retry-delay 2 --retry-all-errors "$TODOS_URL")"
echo "$todos_body" | grep -qiE 'DOCTYPE|root|Pharmacy Portal|Todos'
echo "OK ${TODOS_URL}"

smoke_manifest() {
  local url="$1"
  echo "Smoke: ${url}"
  manifest="$(curl -fsSL --retry 5 --retry-delay 2 --retry-all-errors "$url")"
  if command -v jq >/dev/null 2>&1; then
    echo "$manifest" | jq -e 'type == "object"' >/dev/null
    echo "$manifest" | jq -e 'has("id") or has("name") or has("meta") or has("exposes") or length > 0' >/dev/null
  else
    echo "$manifest" | grep -qiE 'exposes|remoteEntry|id|name'
  fi
  echo "OK ${url}"
}

LOGIN_URL="${ORIGIN}/login"
echo "Smoke: ${LOGIN_URL}"
login_code="$(curl -fsSIL --retry 5 --retry-delay 2 --retry-all-errors -o /dev/null -w '%{http_code}' "$LOGIN_URL")"
if [ "$login_code" != "200" ]; then
  echo "::error::/login returned HTTP ${login_code}" >&2
  exit 1
fi
echo "OK ${LOGIN_URL}"

REGISTER_URL="${ORIGIN}/register"
echo "Smoke: ${REGISTER_URL}"
register_code="$(curl -fsSIL --retry 5 --retry-delay 2 --retry-all-errors -o /dev/null -w '%{http_code}' "$REGISTER_URL")"
if [ "$register_code" != "200" ]; then
  echo "::error::/register returned HTTP ${register_code}" >&2
  exit 1
fi
echo "OK ${REGISTER_URL}"

smoke_manifest "${TODO_MANIFEST}"
smoke_manifest "${AUTH_MANIFEST}"
smoke_manifest "${ONBOARDING_MANIFEST}"
