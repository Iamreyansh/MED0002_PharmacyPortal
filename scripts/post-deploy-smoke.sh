#!/usr/bin/env bash
# Post-deploy smoke for the Pharmacy Portal host.
set -euo pipefail

URL="${1:-https://pharmacy.nammamedmate.com/}"
TODO_MANIFEST="${TODO_MANIFEST_URL:-https://todo.mfe.nammamedmate.com/mf-manifest.json}"
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

echo "Smoke: ${TODO_MANIFEST}"
manifest="$(curl -fsSL --retry 5 --retry-delay 2 --retry-all-errors "$TODO_MANIFEST")"
if command -v jq >/dev/null 2>&1; then
  echo "$manifest" | jq -e 'type == "object"' >/dev/null
  echo "$manifest" | jq -e 'has("id") or has("name") or has("meta") or has("exposes") or length > 0' >/dev/null
else
  echo "$manifest" | grep -qiE 'exposes|remoteEntry|id|name'
fi
echo "OK ${TODO_MANIFEST}"
