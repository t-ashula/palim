#!/bin/sh

set -eu

unicode_data=${1:?Unicode IDNA data path is required}
root=${PALIM_REPOSITORY_ROOT:-$(git rev-parse --show-toplevel)}

node "$root/tools/url/generate-idna-mapping.mjs" \
  "$unicode_data/IdnaMappingTable.txt" \
  "$root/src/url/idna-mapping.json"

node "$root/tools/url/generate-idna-properties.mjs" \
  "$unicode_data/DerivedCombiningClass.txt" \
  "$unicode_data/DerivedJoiningType.txt" \
  "$unicode_data/DerivedBidiClass.txt" \
  "$root/src/url/idna-properties.json"
