#!/usr/bin/env bash
# Usage: optimization_test.sh <dist dir> <optimized: true|false>
# Fails when the bundle lacks what the Angular CLI's build gives that configuration: modulepreload
# hints for chunks that exist, the font import only in the global stylesheet, and when optimized,
# minified component styles and the critical CSS inlined into index.html.
set -euo pipefail

dist="${1:?usage: $0 <dist dir> <optimized>}"
optimized="${2:?usage: $0 <dist dir> <optimized>}"
index="$dist/index.html"
fail() { echo "$*" >&2; exit 1; }

preloads="$(grep -o 'rel="modulepreload" href="[^"]*"' "$index" | sed 's/.*href="//; s/"$//')"
[ -n "$preloads" ] || fail "index.html has no modulepreload hints"
for chunk in $preloads; do
  [ -f "$dist/$chunk" ] || fail "index.html preloads $chunk, which is not in $dist"
done

if grep -l 'fonts.googleapis' "$dist"/*.js; then
  fail "a component style above imports the web font; only the global stylesheet may"
fi

if [ "$optimized" = true ]; then
  grep -q '<style>' "$index" || fail "index.html has no inlined critical CSS"
  grep -q 'media="print" onload="this.media=' "$index" || fail "the stylesheet still blocks rendering"
  # Minified, an encapsulated selector is followed directly by its block.
  if grep -lF '%COMP%] {' "$dist"/*.js; then
    fail "the files above carry unminified component styles"
  fi
else
  if grep -q 'media="print"' "$index"; then
    fail "an unoptimized index.html has the critical CSS inlined"
  fi
fi
echo "ok: $(echo "$preloads" | wc -l | tr -d ' ') modulepreload hints, optimized=$optimized"
