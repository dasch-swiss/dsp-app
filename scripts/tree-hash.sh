#!/usr/bin/env bash
# Usage: scripts/tree-hash.sh <dir>
# Prints one sha256 over the sorted relative paths and contents of every file under <dir>, so two
# trees are equal exactly when their hashes are.
set -euo pipefail

DIR="${1:?usage: $0 <dir>}"
cd -- "$DIR"
[ -n "$(find . -type f -print -quit)" ] || { echo "no files under $DIR" >&2; exit 1; }

if command -v sha256sum >/dev/null; then
  SHA256=(sha256sum)
else
  SHA256=(shasum -a 256)
fi

find . -type f -print0 | LC_ALL=C sort -z | xargs -0 "${SHA256[@]}" | "${SHA256[@]}" | cut -d ' ' -f 1
