#!/usr/bin/env bash
# Bazel workspace status (.bazelrc's --workspace_status_command), one `KEY VALUE` per line.
# Only stamped targets (`--stamp`) read these; STABLE_* keys rebuild them when the value changes.
set -euo pipefail

cd "${BUILD_WORKSPACE_DIRECTORY:-.}"

echo "STABLE_GIT_COMMIT $(git rev-parse HEAD 2>/dev/null || echo unknown)"
# The image's build tag.
echo "STABLE_GIT_VERSION $(git describe --tag --match 'v[0-9]*' --dirty --abbrev=7 --always 2>/dev/null || echo unknown)"
