#!/bin/sh

set -eu

repository_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
exec sh "$repository_root/tools/wpt/docker.sh" conformance "$@"
