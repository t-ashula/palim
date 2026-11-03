#!/bin/sh

set -eu

fixture=${1:?html-build checkout path is required}
root=${PALIM_REPOSITORY_ROOT:-$(git rev-parse --show-toplevel)}
output_directory=$(mktemp -d)
output_file="$root/src/html/entities.json"

trap 'rm -rf -- "$output_directory"' EXIT HUP INT TERM

if ! ENTITIES_OUTPUT="$output_directory" bash "$fixture/entities/build.sh" --quiet; then
  jq empty "$output_directory/entities.json"
fi

mv "$output_directory/entities.json" "$output_file"
trap - EXIT HUP INT TERM
