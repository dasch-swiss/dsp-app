#!/usr/bin/env bash
# Usage: scripts/publish-dsp-js-check.sh <built npm_package dir>
# Compares the package release-dsp-js.yml would publish with the last published @dasch-swiss/dsp-js:
# every package.json field but `version` must be equal, and every file the published tarball holds
# must still be packed. Files the published tarball lacks are listed; they are new sources.
set -euo pipefail

PKG="$(cd "${1:?usage: $0 <npm_package dir>}" && pwd -P)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$WORK/ours" "$WORK/published"
(cd "$WORK/ours" && npm pack --silent "$PKG" >/dev/null)
curl -fsSL "$(cd "$WORK" && npm view @dasch-swiss/dsp-js dist.tarball)" -o "$WORK/published.tgz"

tar -tzf "$WORK"/ours/*.tgz | sed 's#^package/##' | LC_ALL=C sort >"$WORK/ours.txt"
tar -tzf "$WORK/published.tgz" | sed 's#^package/##' | LC_ALL=C sort >"$WORK/published.txt"
tar -xzf "$WORK"/ours/*.tgz -C "$WORK/ours" package/package.json
tar -xzf "$WORK/published.tgz" -C "$WORK/published" package/package.json

status=0
missing="$(LC_ALL=C comm -13 "$WORK/ours.txt" "$WORK/published.txt")"
if [ -n "$missing" ]; then
  echo "published but not packed:" >&2
  echo "$missing" >&2
  status=1
fi
added="$(LC_ALL=C comm -23 "$WORK/ours.txt" "$WORK/published.txt")"
[ -z "$added" ] || printf 'new since the published version:\n%s\n' "$added"

if ! node -e '
const [a, b] = process.argv.slice(1).map(f => JSON.parse(require("fs").readFileSync(f, "utf8")));
delete a.version;
delete b.version;
const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
const diff = keys.filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
for (const k of diff) console.error(`package.json ${k}: packed ${JSON.stringify(a[k])}, published ${JSON.stringify(b[k])}`);
process.exit(diff.length ? 1 : 0);
' "$WORK/ours/package/package.json" "$WORK/published/package/package.json"; then
  status=1
fi
exit "$status"
