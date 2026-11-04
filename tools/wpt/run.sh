#!/bin/sh

set -eu

root=$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)

if [ "$#" -eq 0 ]; then
  set -- --default
fi

exec sh "$root/tools/wpt/docker.sh" "$@"
