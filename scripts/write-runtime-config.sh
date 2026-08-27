#!/usr/bin/env bash
# Write public runtime-config.json for a deployed environment. No secrets.
set -euo pipefail

OUT="${1:?usage: write-runtime-config.sh <file> <mfe-domain-suffix> [api-base-url]}"
SUFFIX="${2:?mfe domain suffix required}"
API_BASE="${3:-}"

python3 - "${OUT}" "${SUFFIX}" "${API_BASE}" <<'PY'
import json, sys, pathlib
out, suffix, api = sys.argv[1], sys.argv[2], sys.argv[3]
api = api.rstrip("/")
allowed = {
    "",
    "https://core.api.nammamedmate.com",
    "https://core.api.staging.nammamedmate.com",
}
if api not in allowed:
    raise SystemExit(f"apiBaseUrl not allowlisted: {api}")
payload = {"apiBaseUrl": api, "mfeDomainSuffix": suffix}
pathlib.Path(out).write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {out}")
PY
