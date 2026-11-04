#!/bin/sh

set -eu

root=$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)
image=palim-wpt

sync_required=false
if [ ! -d "$root/conformance/wpt/wpt" ] \
  || [ ! -f "$root/src/html/entities.json" ] \
  || [ ! -f "$root/src/url/idna-mapping.json" ] \
  || [ ! -f "$root/src/url/idna-properties.json" ] \
  || [ ! -f "$root/vendor/engine262/package.json" ]; then
  sync_required=true
fi
if [ "$sync_required" = true ]; then
  PALIM_REPOSITORY_ROOT="$root" sh "$root/tools/conformance/sync.sh"
fi

session_id="$(date -u +%Y%m%dT%H%M%SZ)-$$"
raw_directory="$root/tmp/wpt/$session_id"
case "${1:-}" in
  --default)
    report_directory="$root/reports/wpt"
    container_report_directory=/workspace/reports/wpt
    ;;
  *)
    report_directory="$raw_directory/report"
    container_report_directory="/workspace/tmp/wpt/$session_id/report"
    ;;
esac

docker build \
  --file "$root/tools/wpt/Dockerfile" \
  --tag "$image" \
  "$root"
mkdir -p "$raw_directory" "$report_directory"
set +e
docker run \
  --rm \
  --volume "$root/conformance:/workspace/conformance" \
  --volume "$root/reports:/workspace/reports" \
  --volume "$root/tmp:/workspace/tmp" \
  --env "PALIM_CONFORMANCE_RAW_DIRECTORY=/workspace/tmp/wpt/$session_id" \
  --env "PALIM_CONFORMANCE_REPORT_DIRECTORY=$container_report_directory" \
  --env "PALIM_CONFORMANCE_MANIFEST=/workspace/conformance/conformance.json" \
  --env "PALIM_WPT_MANIFEST=/workspace/conformance/wpt/wpt/MANIFEST.json" \
  --env "PALIM_WPT_INCLUDE_FILE=/workspace/tools/wpt/include.txt" \
  --env "PALIM_WPT_EXCLUDE_FILE=/workspace/tools/wpt/exclude.txt" \
  "$image" \
  "$@"
status=$?
set -e

printf 'Raw results: %s\n' "$raw_directory"
printf 'Report: %s\n' "$report_directory"
exit "$status"
