#!/bin/sh

set -eu

fixture=${1:?engine262 checkout path is required}
root=${PALIM_REPOSITORY_ROOT:-$(git rev-parse --show-toplevel)}
patch_directory="$root/tools/conformance/engine262/engine262/patches"
vendor_directory="$root/vendor/engine262"
staging_directory=$(mktemp -d)

trap 'rm -rf -- "$staging_directory"' EXIT HUP INT TERM

LC_COLLATE=C
export LC_COLLATE

for patch_file in "$patch_directory"/*.patch; do
  case ${patch_file##*/} in
    [0-9][0-9][0-9][0-9]-*.patch) ;;
    *)
      echo "engine262 patch name must start with a four-digit sequence: $patch_file" >&2
      exit 1
      ;;
  esac
done

for patch_file in "$patch_directory"/[0-9][0-9][0-9][0-9]-*.patch; do
  if git -C "$fixture" apply --check "$patch_file" 2>/dev/null; then
    git -C "$fixture" apply "$patch_file"
  elif ! git -C "$fixture" apply --reverse --check "$patch_file" 2>/dev/null; then
    echo "engine262 patch does not apply cleanly: $patch_file" >&2
    exit 1
  fi
done

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
