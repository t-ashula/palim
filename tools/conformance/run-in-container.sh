#!/bin/sh

set -eu

repository_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)

cd "$repository_root"
npx vitest run \
  --project conformance \
  --reporter=default \
  --reporter=./tools/conformance/reporter.ts \
  "$@"
