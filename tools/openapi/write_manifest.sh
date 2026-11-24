#!/usr/bin/env bash
# Usage: tools/openapi/write_manifest.sh <generator output dir>
# Rewrites tools/openapi/openapi_files.bzl from the generator's .openapi-generator/FILES.
set -euo pipefail

OUT="${1:?usage: $0 <generator output dir>}"
MANIFEST="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/openapi_files.bzl"

{
  cat <<'HEADER'
"""The files the OpenAPI generator writes for dsp-api_spec.yaml, from its .openapi-generator/FILES.

ng_project needs its sources by name, so the generator output cannot be a tree artifact.
`just openapi-generate` rewrites this file; do not edit it by hand.
"""

OPENAPI_FILES = [
HEADER
  { grep -v '^$' "$OUT/.openapi-generator/FILES"; printf '%s\n' .openapi-generator/FILES .openapi-generator/VERSION; } |
    LC_ALL=C sort -u | sed 's/.*/    "&",/'
  echo "]"
} >"$MANIFEST.tmp"
# A half-written manifest would stop Bazel from loading the package that could regenerate it.
mv "$MANIFEST.tmp" "$MANIFEST"
