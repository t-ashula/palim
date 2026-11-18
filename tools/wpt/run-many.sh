#!/bin/sh

set -eu

usage() {
  cat <<'EOF'
Usage:
  sh tools/wpt/run-many.sh --jobs <count> <url>...
  sh tools/wpt/run-many.sh --jobs <count> --file <path>
  <url-source> | sh tools/wpt/run-many.sh --jobs <count>

The file and standard-input forms accept one URL per line. Empty lines are
ignored. Each worker runs one URL with:

  npm run wpt:test -- <url>
EOF
}

root=$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)
jobs=
url_file=

while [ "$#" -gt 0 ]; do
  case "$1" in
    --jobs)
      if [ "$#" -lt 2 ]; then
        printf '%s\n' 'run-many.sh: --jobs requires a value' >&2
        exit 2
      fi
      jobs=$2
      shift 2
      ;;
    --file)
      if [ "$#" -lt 2 ]; then
        printf '%s\n' 'run-many.sh: --file requires a path' >&2
        exit 2
      fi
      url_file=$2
      shift 2
      ;;
    --help)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    -*)
      printf 'run-many.sh: unknown option: %s\n' "$1" >&2
      exit 2
      ;;
    *)
      break
      ;;
  esac
done

case "$jobs" in
  '' | 0 | *[!0-9]*)
    printf '%s\n' 'run-many.sh: --jobs must be a positive integer' >&2
    exit 2
    ;;
esac

if [ -n "$url_file" ] && [ "$#" -gt 0 ]; then
  printf '%s\n' 'run-many.sh: --file and URL arguments cannot be used together' >&2
  exit 2
fi

if [ -n "$url_file" ] && [ ! -f "$url_file" ]; then
  printf 'run-many.sh: URL file does not exist: %s\n' "$url_file" >&2
  exit 2
fi

cd "$root"

docker build \
  --file "$root/tools/wpt/Dockerfile" \
  --tag palim-wpt \
  "$root"
docker run \
  --rm \
  --volume "$root/conformance:/workspace/conformance" \
  palim-wpt \
  --prepare

run_workers() {
  xargs -0 -r -n 1 -P "$jobs" sh -c '
    url=$1
    PALIM_WPT_ENVIRONMENT_PREPARED=1 \
      PALIM_WPT_SKIP_BUILD=1 \
      npm run wpt:test -- "$url"
  ' sh
}

emit_lines() {
  while IFS= read -r url || [ -n "$url" ]; do
    if [ -n "$url" ]; then
      printf '%s\0' "$url"
    fi
  done
}

if [ "$#" -gt 0 ]; then
  printf '%s\0' "$@" | run_workers
elif [ -n "$url_file" ]; then
  emit_lines < "$url_file" | run_workers
elif [ ! -t 0 ]; then
  emit_lines | run_workers
else
  printf '%s\n' 'run-many.sh: provide URL arguments, --file, or standard input' >&2
  exit 2
fi
