---
name: update-openapi-client
description: Regenerate the generated OpenAPI client from the dsp-api spec, and diagnose a failing check-openapi-sync. Use when the vendored dsp-api_spec.yaml needs updating, when consuming dsp-api changes in DSP-APP, or when check-openapi-sync / dev-server E2E goes red after a cross-repo change.
allowed-tools: Bash, Read, Edit, Glob, Grep
---

# Update the generated OpenAPI client

## Commands
Run inside the Nix dev shell (direnv loads it):
- `just openapi-generate` - Generate the client with Bazel from the vendored spec, refresh the
  file manifest the Bazel action declares (`tools/openapi/openapi_files.bzl`), and copy the client
  to `src/generated/` for the IDE
- `just openapi-check` - Smart diff check ignoring metadata (same logic as CI); `--verbose` shows
  the differences
- `just openapi-update` - Download the dev API's spec and regenerate the client (one command)
- The vendored spec is `libs/vre/3rd-party-services/open-api/dsp-api_spec.yaml`
- Smart diff via `scripts/check-openapi-sync.sh` ignores metadata changes
- Only fails on meaningful changes (endpoints, schemas, parameters)
- Commit the spec and, when files were added or removed, `tools/openapi/openapi_files.bzl`;
  `src/generated/` is gitignored and Bazel never reads it

**Deploy coupling — when a red check is expected:** the sync check compares the vendored spec
against the **live dev API** (`https://api.dev.dasch.swiss/api/docs/docs.yaml`), not against a
dsp-api branch. A PR that consumes dsp-api changes which are merged but **not yet deployed to dev**
will therefore fail `check-openapi-sync` (and dev-server E2E) **by design** until the API deploy
lands. Do not "fix" the spec to silence it. Sequence for stacked cross-repo changes:
merge the dsp-api PR → wait for the dev deploy → run `just openapi-update` → CI turns green.
