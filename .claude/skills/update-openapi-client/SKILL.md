---
name: update-openapi-client
description: Regenerate the generated OpenAPI client from the dsp-api spec, and diagnose a failing check-openapi-sync. Use when the vendored dsp-api_spec.yaml needs updating, when consuming dsp-api changes in DSP-APP, or when check-openapi-sync / dev-server E2E goes red after a cross-repo change.
allowed-tools: Bash, Read, Edit, Glob, Grep
---

# Update the generated OpenAPI client

## Commands
- `npm run generate-openapi-module` - Generate TypeScript client from OpenAPI spec
- `npm run check-openapi-sync` - Smart diff check ignoring metadata (same logic as CI)
- `npm run update-openapi` - Update spec file and regenerate client (one command)
- Uses local spec file `libs/vre/3rd-party-services/open-api/dsp-api_spec.yaml`
- Smart diff via `scripts/check-openapi-sync.sh` ignores metadata changes
- Only fails on meaningful changes (endpoints, schemas, parameters)
- Script supports `--verbose` flag for detailed diff output

**Deploy coupling — when a red check is expected:** the sync check compares the vendored spec
against the **live dev API** (`https://api.dev.dasch.swiss/api/docs/docs.yaml`), not against a
dsp-api branch. A PR that consumes dsp-api changes which are merged but **not yet deployed to dev**
will therefore fail `check-openapi-sync` (and dev-server E2E) **by design** until the API deploy
lands. Do not "fix" the spec to silence it. Sequence for stacked cross-repo changes:
merge the dsp-api PR → wait for the dev deploy → run `npm run update-openapi` → CI turns green.
