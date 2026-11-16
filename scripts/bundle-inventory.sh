#!/usr/bin/env bash
# Usage: scripts/bundle-inventory.sh <dir>
# Prints every file under <dir> with its size in bytes, the content hash in its name replaced by
# [hash], sorted, then the file count and total size. Two builds "match" by the rule in
# docs/contribution/bazel-baselines.md, not by an equal output.
set -euo pipefail

DIR="${1:?usage: $0 <dir>}"
cd -- "$DIR"
[ -n "$(find . -type f -print -quit)" ] || { echo "no files under $DIR" >&2; exit 1; }

find . -type f -print0 | xargs -0 wc -c | grep -v ' total$' | awk '
{
  size = $1
  file = substr($0, index($0, $2))
  sub(/^\.\//, "", file)
  print file "\t" size
}' | sed -E 's/-[A-Z0-9]{8}\./-[hash]./g' | LC_ALL=C sort -t "$(printf '\t')" -k1,1 -k2,2n | awk -F '\t' '
{ print; files += 1; bytes += $2 }
END { print "files\t" files; print "bytes\t" bytes }'
