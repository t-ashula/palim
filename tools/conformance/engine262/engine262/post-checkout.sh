#!/bin/sh

set -eu

fixture=${1:?engine262 checkout path is required}
root=${PALIM_REPOSITORY_ROOT:-$(git rev-parse --show-toplevel)}
patch_file="$root/tools/conformance/engine262/engine262/patches/annex-b-extended-pattern-character.patch"
vendor_directory="$root/vendor/engine262"
staging_directory=$(mktemp -d)

trap 'rm -rf -- "$staging_directory"' EXIT HUP INT TERM

if git -C "$fixture" apply --check "$patch_file" 2>/dev/null; then
  git -C "$fixture" apply "$patch_file"
elif ! git -C "$fixture" apply --reverse --check "$patch_file" 2>/dev/null; then
  echo "engine262 patch does not apply cleanly" >&2
  exit 1
fi

git -C "$fixture" submodule update --init --depth 1 -- test/test262/test262

(
  cd "$fixture"
  npm ci
  npm run build
)

mkdir -p "$staging_directory/package"
tar \
  -C "$fixture" \
  --exclude=.git \
  --exclude=node_modules \
  -cf - \
  . \
  | tar -C "$staging_directory/package" -xf -
rm -rf -- "$vendor_directory"
mkdir -p -- "$(dirname -- "$vendor_directory")"
mv "$staging_directory/package" "$vendor_directory"
