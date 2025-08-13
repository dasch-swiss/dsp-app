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

Once the DSP-API has meaningful changes, which should be communicated by the `CI / Check OpenAPI Spec is Up-to-Date` job failure, run the OpenAPI update which generate new version on your machine:

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
git commit -m "update OpenAPI spec for DSP-API changes"
```

### Available Scripts

- `npm run check-openapi-sync` - Smart diff check ignoring metadata (same logic as CI)
- `npm run update-openapi` - Update spec file and regenerate client (one command)  
- `npm run generate-openapi-module` - Generate client from existing spec file

### CI Integration

The GitHub Actions workflow includes a `check-openapi-sync` job that:
- Downloads the latest API spec from `https://api.dev.dasch.swiss/api/docs/docs.yaml`
- Uses smart diff that ignores metadata (versions, descriptions, examples, tags)
- Only fails CI on meaningful changes (endpoints, schemas, parameters)
- Provides clear instructions on how to update when changes are detected

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
