#!/usr/bin/env bash
# Usage: optimization_test.sh <dist dir> <optimized: true|false>
# Fails when the bundle lacks what the Angular CLI's build gives that configuration: modulepreload
# hints for chunks that exist, the icon font face once and only in the global stylesheet, the icon
# class scoped in the components that use `config`, and when optimized, minified component styles
# and the critical CSS inlined into index.html.
set -euo pipefail

dist="${1:?usage: $0 <dist dir> <optimized>}"
optimized="${2:?usage: $0 <dist dir> <optimized>}"
index="$dist/index.html"
fail() { echo "$*" >&2; exit 1; }
scripts=("$dist"/*.js)
[ -f "${scripts[0]}" ] || fail "no JavaScript in $dist"

preloads="$(grep -o 'rel="modulepreload" href="[^"]*"' "$index" | sed 's/.*href="//; s/"$//' || true)"
[ -n "$preloads" ] || fail "index.html has no modulepreload hints"
for chunk in $preloads; do
  [ -f "$dist/$chunk" ] || fail "index.html preloads $chunk, which is not in $dist"
done

if grep -l 'fonts.googleapis' "$dist"/*.js "$dist"/*.css; then
  fail "a stylesheet above imports Google's font CSS, which blocks rendering; apps/dsp-app/src/styles/_font.scss declares the face"
fi
if grep -l 'fonts.gstatic' "$dist"/*.js; then
  fail "a component style above declares the icon font face; it belongs in apps/dsp-app/src/styles/_font.scss only"
fi
faces="$(cat "$dist"/styles-*.css | tr -d ' \n' | { grep -oE "@font-face\{font-family:['\"]?MaterialIcons['\"]?;" || true; } | wc -l | tr -d ' ')"
[ "$faces" -eq 1 ] || fail "the global stylesheet declares the Material Icons face $faces times, not once"

# Inside the components whose Sass uses `config` (28 when written), and 3 with plain-CSS inline
# styles that copy the rule, icons stay 24px. The bound sits well above the inline copies alone.
owners="libs/vre/ui/styles/_config.scss must use _material-icons.scss, and the inline copies must equal it"
scoped_rules="$(cat "$dist"/*.js | tr -d ' \n' | { grep -oE '\.material-icons\[_ngcontent-%COMP%\]\{[^}]*\}' || true; })"
scoped="$(echo -n "$scoped_rules" | grep -c . || true)"
[ "$scoped" -ge 20 ] || fail "$scoped component styles scope .material-icons; $owners"
variants="$(echo "$scoped_rules" | tr "'" '"' | sed 's/;}$/}/' | sort -u | wc -l | tr -d ' ')"
[ "$variants" -eq 1 ] || fail "the scoped .material-icons rules differ ($variants variants); $owners"

if [ "$optimized" = true ]; then
  grep -q '<style>' "$index" || fail "index.html has no inlined critical CSS"
  grep -q 'media="print"' "$index" || fail "the stylesheet still blocks rendering"
  # Minified (minify-component-styles in esbuild.config.mjs), an encapsulated selector is
  # followed directly by its block.
  if grep -lF '%COMP%] {' "$dist"/*.js; then
    fail "the files above carry unminified component styles"
  fi
else
  if grep -q 'media="print"' "$index"; then
    fail "an unoptimized index.html has the critical CSS inlined"
  fi
fi
echo "ok: $(echo "$preloads" | wc -l | tr -d ' ') modulepreload hints, optimized=$optimized"
