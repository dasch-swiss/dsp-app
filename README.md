# DaSCH Applications and Libraries Monorepo

[![Github](https://img.shields.io/github/v/tag/dasch-swiss/dsp-app?include_prereleases&label=Github%20tag)](https://github.com/dasch-swiss/dsp-app)
[![Docker](https://img.shields.io/docker/v/daschswiss/dsp-app?label=Docker%20image)](https://hub.docker.com/r/daschswiss/dsp-app)
[![CI](https://github.com/dasch-swiss/dsp-app/workflows/CI/badge.svg)](https://github.com/dasch-swiss/dsp-app/actions?query=workflow%3ACI)
[![codecov](https://codecov.io/gh/dasch-swiss/dsp-app/branch/main/graph/badge.svg)](https://codecov.io/gh/dasch-swiss/dsp-app)

DSP-APP is the user interface for the [DaSCH Service Platform](https://dasch.swiss) — a software framework for storing, sharing, and working with primary resources and data in the humanities. It connects to [DSP-API](https://github.com/dasch-swiss/dsp-api) via [DSP-JS](libs/dsp-js/) and is released under the [GNU Affero General Public License](http://www.gnu.org/licenses/agpl-3.0.en.html).

This monorepo is built on:

- **Nx** — See [package.json](https://github.com/dasch-swiss/dsp-app/blob/main/package.json) for current version
- **Angular** — See [package.json](https://github.com/dasch-swiss/dsp-app/blob/main/package.json) for current version
- **Node.js** — Version managed via [.nvmrc](.nvmrc)

## Quick Start

Use the Node.js version supported by the installed Angular version ([compatibility table](https://angular.dev/reference/versions)), or the version pinned in [.nvmrc](.nvmrc).

```shell
npm install
npm run start-local   # app runs at http://localhost:4200
```

Requires a running [DSP-API](https://github.com/dasch-swiss/dsp-api) backend. To start it locally:

```shell
# In the dsp-api repository
make init-db-test
make stack-without-app
```

Every PR that touches `apps/dsp-app/src/` or `libs/` gets an automatic live preview deployed to Google Cloud Run — the URL is posted as a PR comment. You can also trigger a preview for any branch manually via the [PR Preview](https://github.com/dasch-swiss/dsp-app/actions/workflows/cloud-run-pr-preview.yml) workflow. To publish a Docker image directly from any branch (e.g. for a hotfix), trigger the [Publish from branch](https://github.com/dasch-swiss/dsp-app/actions/workflows/publish-from-branch.yml) workflow manually.

## Quick Commands

Most common operations for daily development:

| Task | Command |
|------|---------|
| Start local development | `npm run start-local` |
| Start with observability | `npm run start-local-with-observability` |
| Run tests | `npm run test-local` |
| Run all tests (CI mode) | `npm run test-ci-all` |
| Lint all libs w/o auto-fix | `npm run lint-all` |
| Lint all libs with auto-fix | `npm run lint-fix-all` |
| Open E2E tests UI | `npm run e2e-local` |
| Run E2E tests (headless) | `npm run e2e-ci` |
| Build for development | `npm run build` |
| Build for production | `npm run build-prod` |
| Generate test coverage | `npm run unit-test-coverage` |
| Browse all component stories | `npm run storybook` |
| Build static Storybook | `npm run build-storybook` |
| Run Storybook interaction tests | `npm run test-storybook` |

For all available commands, see [package.json](https://github.com/dasch-swiss/dsp-app/blob/main/package.json).

## Developer Guide

### Working with Individual Libraries

The monorepo contains multiple independently buildable libraries:

```bash
# Test, build, or lint a specific library
nx run [library-name]:test
nx run [library-name]:build
nx run [library-name]:lint

# Example
nx run vre-ui-date-picker:test
```

> **Note:** To run `nx` commands, install it globally (`npm install -g nx`) or use `npx nx`.

Library path aliases are defined in [tsconfig.base.json](https://github.com/dasch-swiss/dsp-app/blob/main/tsconfig.base.json) under `paths`. Main VRE libraries use the `@dasch-swiss/vre/*` namespace.

### OpenAPI Client Generation

The TypeScript client for DSP-API is auto-generated from the OpenAPI spec:

```shell
npm run check-openapi-sync      # Check if the generated client is up to date
npm run update-openapi           # Update spec and regenerate client
npm run generate-openapi-module # Regenerate from the local spec only
```

The client is also regenerated automatically as part of `npm install` (via `postinstall`), so it stays in sync after dependency updates.

See [OpenAPI Client README](https://github.com/dasch-swiss/dsp-app/blob/main/libs/vre/3rd-party-services/open-api/README.md) for full details.

### IDE Plugins

- [Nx Console for JetBrains](https://plugins.jetbrains.com/plugin/15101-nx-console-idea)
- [Nx Console for VS Code](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console)

### Local Observability

Run a Grafana stack alongside the app to view Faro telemetry (logs, traces, Web Vitals):

```shell
npm run start-local-with-observability
```

Grafana is available at [http://localhost:3001](http://localhost:3001) (credentials: `admin`/`admin`). Includes Loki (logs), Tempo (traces), and Mimir (metrics).

To stop: `docker compose -f docker-compose.observability.yml down`

## Storybook

A single global [Storybook](https://storybook.js.org/) instance aggregates stories from all libraries and apps:

```shell
npm run storybook           # Start dev server (http://localhost:4400)
npm run build-storybook     # Build a static bundle to dist/storybook/
npm run test-storybook      # Run story interaction tests (requires a running server)
```

Stories are auto-discovered from any `*.stories.ts` file under `libs/` or `apps/` — no registration needed when adding new stories.

## Issues & Contributions

- [Developer docs](https://docs.dasch.swiss/latest/DSP-APP/contribution)

To report an issue or contribute, contact us at [support@dasch.swiss](mailto:support@dasch.swiss).
