#!/bin/sh

set -eu

root=${PALIM_REPOSITORY_ROOT:-$(git rev-parse --show-toplevel)}
manifest="$root/conformance/conformance.json"
force=${1-}

if [ "$#" -gt 1 ] || { [ -n "$force" ] && [ "$force" != "--force" ]; }; then
  echo "usage: $0 [--force]" >&2
  exit 2
fi

jq -r '.fixtures | to_entries[] | [.key, (.value.type // "git"), (.value.repository // ""), .value.revision, (.value.sha256 // ""), (.value.stripComponents // 0)] | @tsv' "$manifest" |
while IFS="$(printf '\t')" read -r name type repository revision sha256 strip_components; do
  target="$root/conformance/$name"

  if [ -e "$target" ]; then
    if [ "$force" != "--force" ]; then
      printf 'already exists: %s\n' "$name"
    else
      rm -rf -- "$target"
    fi
  fi

  if [ ! -e "$target" ]; then
    mkdir -p -- "$(dirname -- "$target")"
    if [ "$type" = "git" ]; then
      git init --quiet "$target"
      git -C "$target" remote add origin "$repository"
      git -C "$target" fetch --quiet --depth 1 origin "$revision"
      git -C "$target" checkout --quiet --detach FETCH_HEAD
      printf 'checked out: %s at %s\n' "$name" "$revision"
    elif [ "$type" = "archive" ]; then
      temporary=$(mktemp -d)
      archive="$temporary/archive"
      curl -fsSL "$repository" -o "$archive"
      actual_sha256=$(sha256sum "$archive" | cut -d ' ' -f 1)
      if [ "$actual_sha256" != "$sha256" ]; then
        rm -rf -- "$temporary"
        printf 'checksum mismatch: %s\n' "$name" >&2
        exit 1
      fi
      mkdir -p -- "$target"
      tar -xzf "$archive" -C "$target" --strip-components="$strip_components"
      rm -rf -- "$temporary"
      printf 'extracted: %s at %s\n' "$name" "$revision"
    elif [ "$type" = "files" ]; then
      temporary=$(mktemp -d)
      jq -r --arg name "$name" '.fixtures[$name].files[] | [.path, .repository, .sha256] | @tsv' "$manifest" |
      while IFS="$(printf '\t')" read -r path file_repository file_sha256; do
        destination="$temporary/$path"
        downloaded=$(mktemp)
        mkdir -p -- "$(dirname -- "$destination")"
        curl -fsSL "$file_repository" -o "$downloaded"
        actual_sha256=$(sha256sum "$downloaded" | cut -d ' ' -f 1)
        if [ "$actual_sha256" != "$file_sha256" ]; then
          rm -f -- "$downloaded"
          rm -rf -- "$temporary"
          printf 'checksum mismatch: %s/%s\n' "$name" "$path" >&2
          exit 1
        fi
        mv "$downloaded" "$destination"
      done
      mv "$temporary" "$target"
      printf 'downloaded: %s at %s\n' "$name" "$revision"
    else
      printf 'unsupported fixture type: %s\n' "$type" >&2
      exit 1
    fi
  fi

  post_checkout="$root/tools/conformance/$name/post-checkout.sh"
  if [ -f "$post_checkout" ]; then
    sh "$post_checkout" "$target"
  fi
done
