#!/bin/sh

set -eu

root=$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)

if [ "${1:-}" = --campaign ]; then
  shift
  exec node --import tsx "$root/tools/wpt/campaign.ts" "$@"
fi

if [ "$#" -eq 0 ]; then
  set -- --default
fi

exec sh "$root/tools/wpt/docker.sh" "$@"
