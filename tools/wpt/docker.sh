#!/bin/sh

set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
image=palim-wpt
session_id="$(date -u +%Y%m%dT%H%M%SZ)-$$"
raw_directory="$root/tmp/conformance/$session_id"
report_directory="$root/reports/conformance"

docker build --file "$root/tools/wpt/Dockerfile" --tag "$image" "$root"
mkdir -p "$raw_directory" "$report_directory"
set +e
docker run \
  --rm \
  --volume "$root/reports:/workspace/reports" \
  --volume "$root/tmp:/workspace/tmp" \
  --env "PALIM_CONFORMANCE_RAW_DIRECTORY=/workspace/tmp/conformance/$session_id" \
  --env "PALIM_CONFORMANCE_REPORT_DIRECTORY=/workspace/reports/conformance" \
  --env "PALIM_CONFORMANCE_MANIFEST=/workspace/conformance/conformance.json" \
  "$image" \
  "$@"
status=$?
set -e

printf 'Raw results: %s\n' "$raw_directory"
printf 'Report: %s\n' "$report_directory"
exit "$status"
