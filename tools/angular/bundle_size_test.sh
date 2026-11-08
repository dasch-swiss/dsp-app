#!/usr/bin/env bash
# Usage: bundle_size_test.sh <dist dir> [budget in bytes]
# Fails when the initial files together exceed the initial budget the Angular CLI enforced: 9 MB,
# the CLI's unit (1024 * 1024 bytes). The initial files are the CLI's: every script, stylesheet
# and modulepreload chunk dist/index.html references, each counted once.
set -euo pipefail

dist="${1:?usage: $0 <dist dir> [budget]}"
budget="${2:-$((9 * 1024 * 1024))}"
index="$dist/index.html"
files="$(grep -oE '<(script|link)[^>]*>' "$index" |
  grep -E '^<script|rel="(stylesheet|modulepreload)"' |
  grep -oE '(src|href)="[^"]*"' | sed -E 's/^(src|href)="(.*)"$/\2/' | sort -u)"
for kind in 'main-*.js' 'polyfills-*.js' 'styles-*.css' 'scripts-*.js'; do
  grep -qx "${kind//\*/.*}" <<<"$files" || { echo "index.html references no $kind" >&2; exit 1; }
done
total=0
while read -r file; do
  [ -f "$dist/$file" ] || { echo "index.html references $file, which is not in $dist" >&2; exit 1; }
  size="$(wc -c <"$dist/$file" | tr -d ' ')"
  echo "$file: $size bytes"
  total=$((total + size))
done <<<"$files"
echo "initial total: $total bytes in $(echo "$files" | wc -l | tr -d ' ') files, budget $budget"
[ "$total" -le "$budget" ] || { echo "initial files exceed the budget" >&2; exit 1; }
