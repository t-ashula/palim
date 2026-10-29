#!/bin/sh

set -eu

root=$(git rev-parse --show-toplevel)
manifest="$root/conformance/conformance.json"
force=${1-}

if [ "$#" -gt 1 ] || { [ -n "$force" ] && [ "$force" != "--force" ]; }; then
  echo "usage: $0 [--force]" >&2
  exit 2
fi

jq -r '.fixtures | to_entries[] | [.key, .value.repository, .value.revision] | @tsv' "$manifest" |
while IFS="$(printf '\t')" read -r name repository revision; do
  target="$root/conformance/$name"

  if [ -e "$target" ]; then
    if [ "$force" != "--force" ]; then
      printf 'already exists: %s\n' "$name"
      continue
    fi
    rm -rf -- "$target"
  fi

  mkdir -p -- "$(dirname -- "$target")"
  git init --quiet "$target"
  git -C "$target" remote add origin "$repository"
  git -C "$target" fetch --quiet --depth 1 origin "$revision"
  git -C "$target" checkout --quiet --detach FETCH_HEAD

  post_checkout="$root/tools/conformance/$name/post-checkout.sh"
  if [ -f "$post_checkout" ]; then
    sh "$post_checkout" "$target"
  fi

  printf 'checked out: %s at %s\n' "$name" "$revision"
done
