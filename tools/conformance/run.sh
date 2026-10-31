#!/bin/sh

set -eu

repository_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
session_id="$(date -u +%Y%m%dT%H%M%SZ)-$$"

export PALIM_CONFORMANCE_RAW_DIRECTORY="$repository_root/tmp/conformance/$session_id"
export PALIM_CONFORMANCE_REPORT_DIRECTORY="$repository_root/reports/conformance"
export PALIM_CONFORMANCE_MANIFEST="$repository_root/conformance/conformance.json"

cd "$repository_root"
npx vitest run \
  --project conformance \
  --reporter=default \
  --reporter=./tools/conformance/reporter.ts \
  "$@"

printf 'Raw results: %s\n' "$PALIM_CONFORMANCE_RAW_DIRECTORY"
printf 'Report: %s\n' "$PALIM_CONFORMANCE_REPORT_DIRECTORY"
