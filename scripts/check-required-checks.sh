#!/usr/bin/env bash
# Usage: scripts/check-required-checks.sh [branch]
# Fails when a status check that branch protection requires on the branch (main by default) has no
# job of that name in ci.yml. A renamed job leaves its required check pending forever, which blocks
# every merge. Reads the protection with the caller's `gh` login, which needs admin rights on the
# repository; it runs locally, not in CI.
set -euo pipefail

BRANCH="${1:-main}"
REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
WORKFLOW="$(git rev-parse --show-toplevel)/.github/workflows/ci.yml"

required="$(gh api "repos/$REPO/branches/$BRANCH/protection" --jq '.required_status_checks.checks[].context')"
[ -n "$required" ] || { echo "check-required-checks: $REPO@$BRANCH requires no status check" >&2; exit 1; }
jobs="$(yq '.jobs[].name' "$WORKFLOW")"

missing=0
while read -r check; do
  if grep -qxF "$check" <<<"$jobs"; then
    echo "ok: $check"
  else
    echo "check-required-checks: $REPO@$BRANCH requires \"$check\", which no job in ci.yml is named" >&2
    missing=1
  fi
done <<<"$required"
exit "$missing"
