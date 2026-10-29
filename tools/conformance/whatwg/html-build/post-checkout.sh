#!/bin/sh

set -eu

fixture=${1:?html-build checkout path is required}
root=$(git rev-parse --show-toplevel)
output_directory=$(mktemp -d)
output_file="$root/src/html/entities.json"

trap 'rm -rf -- "$output_directory"' EXIT HUP INT TERM

ENTITIES_OUTPUT="$output_directory" bash "$fixture/entities/build.sh" --quiet

mv "$output_directory/entities.json" "$output_file"
trap - EXIT HUP INT TERM
