#!/usr/bin/env bash
# Build MED0003 packages that export compiled dist/ (required for file: deps in CI).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MFE_ROOT="${MFE_ROOT:-${ROOT}/../MED0003_MFE}"

if [ ! -d "$MFE_ROOT" ]; then
  echo "MED0003 checkout not found at ${MFE_ROOT}" >&2
  exit 1
fi

cd "$MFE_ROOT"
pnpm install --frozen-lockfile
pnpm --filter @medmate/federation-config --filter @medmate/vite-config run build
echo "Built @medmate/federation-config and @medmate/vite-config dists."
