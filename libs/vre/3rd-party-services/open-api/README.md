# vre-open-api

This library was generated with [Nx](https://nx.dev).

## OpenAPI Client Generation

This library contains auto-generated TypeScript client code for the DSP-API based on OpenAPI specifications.

⚠️ **Generated files are not committed to the repository** - they are created automatically during build and install.

### How it works

1. **Local spec file**: `dsp-api_spec.yaml` contains the DSP-API OpenAPI specification
2. **Auto-generation**: Files are generated automatically:
   - During `npm install` (via postinstall hook)
   - Before build/test/lint operations (via NX dependencies)
   - Manually via `npm run generate-openapi-module`
3. **CI checks**: GitHub Actions automatically detects when the API spec is outdated

### Updating the API client

When DSP-API has meaningful changes, CI will automatically open a PR titled `chore: update dsp-api OpenAPI spec to <version>`. Review the spec diff and merge it when the frontend is ready to adopt the new API.

For manual updates (e.g. on a feature branch):

```bash
# Quick check if update is needed
npm run check-openapi-sync

# One-command update (recommended)
npm run update-openapi

# Or manual steps:
# 1. Update the spec file
curl -o libs/vre/3rd-party-services/open-api/dsp-api_spec.yaml https://api.dev.dasch.swiss/api/docs/docs.yaml

# 2. Generate new client code (if needed for local testing)
npm run generate-openapi-module

# 3. Commit only the spec file change
git add libs/vre/3rd-party-services/open-api/dsp-api_spec.yaml
git commit -m "chore: update dsp-api OpenAPI spec to <version>"
```

### Available Scripts

- `npm run check-openapi-sync` - Smart diff check ignoring metadata (same logic as CI)
- `npm run update-openapi` - Update spec file and regenerate client (one command)  
- `npm run generate-openapi-module` - Generate client from existing spec file

### CI Integration

The GitHub Actions workflow includes two jobs:

- **`check-openapi-sync`**: Downloads the latest spec from `https://api.dev.dasch.swiss/api/docs/docs.yaml`, uses smart diff ignoring metadata, and runs on every push. Retries the download up to 3 times (30s apart) to tolerate DEV deployments. On transient download failure the job passes silently; on spec mismatch it records exit code 1.
- **`update-openapi-spec`**: Runs on `main` only when a spec mismatch is detected. Automatically opens a PR with the updated spec and the detected dsp-api version in the title.

**Smart Diff Logic:**
Both local and CI use the same `scripts/check-openapi-sync.sh` script that:
- Ignores metadata changes (versions, descriptions, examples, tags, servers)
- Only detects meaningful API structure changes (endpoints, schemas, parameters)
- Supports `--verbose` flag for detailed diff output locally
- Provides consistent behavior between development and CI environments

This ensures the generated client code stays in sync with actual API changes while avoiding false positives from documentation updates.

### Development Notes

- **First time setup**: Run `npm install` to generate the client files
- **Generated files location**: `src/generated/` (ignored by git)
- **Build integration**: Generation happens automatically before builds via NX dependencies
- **Manual generation**: Use `nx run vre-open-api:generate` or `npm run generate-openapi-module`
