#!/usr/bin/env bash
# Usage: scripts/visibility-check.sh
# Asserts that Bazel visibility rejects one forbidden dependency per ADR-0001 tier rule. Each seed
# adds a dependency to a real library's `deps` in a scratch copy of the working tree, never in the
# checkout, and the analysis must fail with the visibility error for exactly that edge.
set -euo pipefail

REPO="$(git rev-parse --show-toplevel)"
# A fixed path keeps Bazel's output base, so a second run re-analyses only what changed.
SCRATCH="${VISIBILITY_CHECK_DIR:-${TMPDIR:-/tmp}/dsp-app-visibility-check}"

# source library, its type/scope, forbidden dependency, its type/scope. A target must not already
# depend on its source: the seed would then form a cycle, which fails before visibility is checked.
SEEDS=(
  "libs/vre/ui/progress-indicator ui/shared libs/vre/core/error-handler data-access/shared"
  "libs/vre/ui/progress-indicator ui/shared libs/vre/shared/app-help-page feature/shared"
  "libs/vre/core/config data-access/shared libs/vre/ui/progress-indicator ui/shared"
  "libs/vre/3rd-party-services/analytics data-access/shared libs/vre/shared/app-help-page feature/shared"
  "libs/vre/ui/notification util/shared libs/vre/ui/progress-indicator ui/shared"
  "libs/vre/ui/notification util/shared libs/vre/core/config data-access/shared"
  "libs/vre/ui/notification util/shared libs/vre/shared/app-help-page feature/shared"
  "libs/vre/pages/search/search feature/search libs/vre/pages/system/system feature/system"
  "libs/vre/pages/data-browser feature/shared libs/vre/pages/system/system feature/system"
)

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
  read -r src src_kind dst dst_kind <<<"$seed"
  src_label="//$src:${src##*/}"
  dst_label="//$dst:${dst##*/}"
  rule="$src_kind -> $dst_kind"
  if [ -n "$(bazel query "somepath(//$dst:all, //$src:all)" 2>/dev/null)" ]; then
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

echo "visibility-check: feature and app libraries may depend on every type; only the scope rule binds them"
exit "$failed"
