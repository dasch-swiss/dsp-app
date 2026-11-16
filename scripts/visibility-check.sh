#!/usr/bin/env bash
# Usage: scripts/visibility-check.sh
# Asserts that Bazel visibility rejects one forbidden dependency per ADR-0001 tier rule. Each seed
# adds a dependency to a real library's `deps` in a scratch copy of the working tree, never in the
# checkout, and the analysis must fail with the visibility error for exactly that edge, matched on
# Bazel's message text. Feature and app libraries may depend on every type, so only the scope rule
# has seeds for them.
set -euo pipefail

REPO="$(git rev-parse --show-toplevel)"
# A fixed path, not $TMPDIR (which `nix develop` sets per shell), keeps one Bazel output base for
# every run instead of leaving a new one behind each time.
SCRATCH="${VISIBILITY_CHECK_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/dsp-app-visibility-check}"

# A source library and the forbidden dependency seeded into it; the rule each pair breaks is read
# from LIBRARIES. A target must not already depend on its source: the seed would then form a
# cycle, which fails before visibility is checked.
SEEDS=(
  "libs/vre/ui/progress-indicator libs/vre/core/error-handler"
  "libs/vre/ui/progress-indicator libs/vre/shared/app-help-page"
  "libs/vre/core/config libs/vre/ui/progress-indicator"
  "libs/vre/3rd-party-services/analytics libs/vre/shared/app-help-page"
  "libs/vre/ui/notification libs/vre/ui/progress-indicator"
  "libs/vre/ui/notification libs/vre/core/config"
  "libs/vre/ui/notification libs/vre/shared/app-help-page"
  "libs/vre/pages/search/search libs/vre/pages/system/system"
  "libs/vre/pages/data-browser libs/vre/pages/system/system"
)

# A library's "type/scope" from its LIBRARIES entry.
kind() {
  sed -nE "s|^    \"//$1\": struct\(type = \"([^\"]+)\", scope = \"([^\"]+)\"\),\$|\1/\2|p" \
    "$REPO/tools/angular/visibility.bzl"
}

# A server left by an interrupted run would keep serving a deleted workspace.
[ ! -d "$SCRATCH" ] || (cd -- "$SCRATCH" && bazel shutdown >/dev/null 2>&1) || true
rm -rf -- "$SCRATCH"
mkdir -p -- "$SCRATCH"
(
  cd -- "$REPO"
  git ls-files -z --cached --others --exclude-standard \
    | while IFS= read -r -d '' file; do [ ! -e "$file" ] || printf '%s\0' "$file"; done \
    | tar -c --null -T - -f - \
    | tar -x -f - -C "$SCRATCH"
)
cd -- "$SCRATCH"
trap 'bazel shutdown >/dev/null 2>&1 || true' EXIT

# shellcheck disable=SC2086 # BAZEL_FLAGS is a flag list.
if ! log="$(bazel build --nobuild //libs/... ${BAZEL_FLAGS:-} 2>&1)"; then
  echo "$log" >&2
  echo "visibility-check: the unseeded copy fails analysis, so no seed would prove anything" >&2
  exit 1
fi

failed=0
for seed in "${SEEDS[@]}"; do
  read -r src dst <<<"$seed"
  src_label="//$src:${src##*/}"
  dst_label="//$dst:${dst##*/}"
  src_kind="$(kind "$src")"
  dst_kind="$(kind "$dst")"
  if [ -z "$src_kind" ] || [ -z "$dst_kind" ]; then
    echo "visibility-check: $src or $dst has no one-line entry in LIBRARIES (tools/angular/visibility.bzl)" >&2
    failed=1
    continue
  fi
  rule="$src_kind -> $dst_kind"
  if ! path="$(bazel query "somepath(//$dst:all, //$src:all)" 2>&1)"; then
    echo "$path" >&2
    echo "visibility-check: the cycle query for $src -> $dst failed" >&2
    failed=1
    continue
  fi
  if grep -q '^//' <<<"$path"; then
    echo "visibility-check: $dst depends on $src, so seeding $rule would form a cycle; pick another pair" >&2
    failed=1
    continue
  fi
  build="$src/BUILD.bazel"
  awk -v dep="//$dst" '!done && /^    deps = \[$/ { print; print "        \"" dep "\","; done = 1; next } { print }' \
    "$REPO/$build" >"$build"
  if cmp -s "$REPO/$build" "$build"; then
    echo "visibility-check: no '    deps = [' line in $build to seed" >&2
    failed=1
    continue
  fi
  # shellcheck disable=SC2086
  if log="$(bazel build --nobuild "$src_label" ${BAZEL_FLAGS:-} 2>&1)"; then
    echo "visibility-check: $rule: bazel accepted $src_label -> $dst_label" >&2
    failed=1
  elif grep -qF "rule $src_label: Visibility error:" <<<"$log" \
    && grep -qF "target '$dst_label' is not visible from" <<<"$log"; then
    echo "visibility-check: $rule: rejected $src_label -> $dst_label"
  else
    echo "$log" >&2
    echo "visibility-check: $rule: $src_label failed, but not with the visibility error for $dst_label" >&2
    failed=1
  fi
  cp -- "$REPO/$build" "$build"
done

exit "$failed"
