#!/usr/bin/env bash
# Usage: bundle_size_test.sh <dist dir> [budget in bytes]
# Fails when main, polyfills and styles together exceed the initial budget the Angular CLI
# enforced: 9 MB, the CLI's unit (1024 * 1024 bytes).
set -euo pipefail

dist="${1:?usage: $0 <dist dir> [budget]}"
budget="${2:-$((9 * 1024 * 1024))}"
total=0
for pattern in 'main-*.js' 'polyfills-*.js' 'styles-*.css'; do
  files=("$dist"/$pattern)
  if [ "${#files[@]}" -ne 1 ] || [ ! -f "${files[0]}" ]; then
    echo "expected one $pattern in $dist, found: ${files[*]}" >&2
    exit 1
  fi
  size="$(wc -c <"${files[0]}" | tr -d ' ')"
  echo "${files[0]##*/}: $size bytes"
  total=$((total + size))
done
echo "initial total: $total bytes, budget $budget"
[ "$total" -le "$budget" ] || { echo "initial files exceed the budget" >&2; exit 1; }
