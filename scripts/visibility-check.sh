#!/usr/bin/env bash
# Usage: scripts/visibility-check.sh
# Asserts that Bazel visibility rejects one forbidden dependency per ADR-0001 tier rule. Each seed
# adds a dependency to a real library's `deps` in a scratch copy of the working tree, never in the
# checkout, and the analysis must fail with the visibility error for exactly that edge, matched on
# Bazel's message text. Feature and app libraries may depend on every type, so only the scope rule
# has seeds for them.
#
# Two ways around the tier rules pass that analysis, so two more checks follow: a library target
# made public by hand, and an extra_visibility entry the tree no longer needs. Each is then shown
# to fail on a planted case.
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

LIBRARY_PACKAGES="$(sed -nE 's|^    "//(libs/[^"]+)": struct\(.*$|\1|p' "$REPO/tools/angular/visibility.bzl")"

# Prints every target in a library package that any package may depend on. vre_library makes only
# the lint config and Jest's helper targets public, and no library imports those.
public_library_targets() {
  local all
  all="$(sed 's|^|//|; s|$|:all|' <<<"$LIBRARY_PACKAGES" | paste -sd+ -)"
  if ! bazel query "attr(visibility, '//visibility:public', $all) except attr(name, '^(eslintrc|_test_bazel_.*)\$', $all)" 2>query.log; then
    cat query.log >&2
    echo "visibility-check: the public-target query failed" >&2
    return 1
  fi
}

# Prints "<library> <entry>" for each extra_visibility entry the tree analyses without: its package
# no longer depends on the library, or ADR-0001 allows the edge anyway. Each entry is removed in
# the scratch copy only, one at a time. Takes library packages, every library by default.
stale_extra_visibility() {
  local lib build entry libs=("$@")
  # shellcheck disable=SC2206 # One package per line, no whitespace in a package.
  [ "$#" -gt 0 ] || libs=($LIBRARY_PACKAGES)
  for lib in "${libs[@]}"; do
    build="$lib/BUILD.bazel"
    if grep -qE 'extra_visibility = \[.' "$build"; then
      echo "visibility-check: $build: write extra_visibility one entry per line" >&2
      return 1
    fi
    # shellcheck disable=SC2013 # Labels hold no whitespace, and a read loop would feed bazel's stdin.
    for entry in $(awk '/^    extra_visibility = \[$/ { inside = 1; next } inside && /^    \],?$/ { inside = 0 }
        inside && match($0, /"[^"]+"/) { print substr($0, RSTART + 1, RLENGTH - 2) }' "$build"); do
      if [[ "$entry" != //*:__pkg__ ]]; then
        echo "visibility-check: $build: extra_visibility entry $entry is not a //<package>:__pkg__" >&2
        return 1
      fi
      if ! grep -qxF "        \"$entry\"," "$build"; then
        echo "visibility-check: $build: write extra_visibility entry $entry on its own line as \"<label>\"," >&2
        return 1
      fi
      cp -- "$build" "$build.orig"
      grep -vxF "        \"$entry\"," "$build.orig" >"$build" || true
      # shellcheck disable=SC2086
      if log="$(bazel build --nobuild "${entry%:__pkg__}:all" ${BAZEL_FLAGS:-} 2>&1)"; then
        echo "//$lib $entry"
      elif ! grep -qF "target '//$lib:" <<<"$log" || ! grep -qF "is not visible from" <<<"$log"; then
        mv -- "$build.orig" "$build"
        echo "$log" >&2
        echo "visibility-check: ${entry%:__pkg__} failed without $entry, but not with a visibility error for //$lib" >&2
        return 1
      fi
      mv -- "$build.orig" "$build"
    done
  done
}

if ! public="$(public_library_targets)"; then
  failed=1
elif [ -n "$public" ]; then
  echo "$public" >&2
  echo "visibility-check: these library targets are public; a library takes package_visibility() and extra_visibility only" >&2
  failed=1
fi
if ! stale="$(stale_extra_visibility)"; then
  failed=1
elif [ -n "$stale" ]; then
  echo "$stale" >&2
  echo "visibility-check: these extra_visibility entries are stale (no direct dependency, or ADR-0001 allows it); remove them" >&2
  failed=1
fi

# Plant one of each in a library with no extra_visibility and expect the check above to report it.
plant=libs/vre/ui/progress-indicator
build="$plant/BUILD.bazel"
plant_extra_visibility() {
  awk -v entry="$1" '!done && /^    name = / { print; print "    extra_visibility = ["; print "        \"" entry "\","; print "    ],"; done = 1; next } { print }' \
    "$REPO/$build" >"$build"
}
plant_extra_visibility "//visibility:public"
if grep -qx "//$plant:${plant##*/}" <<<"$(public_library_targets)"; then
  echo "visibility-check: a hand-set //visibility:public on //$plant is reported"
else
  echo "visibility-check: a hand-set //visibility:public on //$plant went unreported" >&2
  failed=1
fi
# system/system is a feature library: ADR-0001 already lets it depend on a shared ui library.
plant_extra_visibility "//libs/vre/pages/system/system:__pkg__"
if grep -qxF "//$plant //libs/vre/pages/system/system:__pkg__" <<<"$(stale_extra_visibility "$plant" 2>/dev/null)"; then
  echo "visibility-check: a stale extra_visibility entry on //$plant is reported"
else
  echo "visibility-check: a stale extra_visibility entry on //$plant went unreported" >&2
  failed=1
fi
cp -- "$REPO/$build" "$build"

exit "$failed"
