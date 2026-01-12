# DaSCH Applications and Libraries Monorepo

[![Github](https://img.shields.io/github/v/tag/dasch-swiss/dsp-das?include_prereleases&label=Github%20tag)](https://github.com/dasch-swiss/dsp-das)
[![Docker](https://img.shields.io/docker/v/daschswiss/dsp-app?label=Docker%20image)](https://hub.docker.com/r/daschswiss/dsp-app)
[![CI](https://github.com/dasch-swiss/dsp-das/workflows/CI/badge.svg)](https://github.com/dasch-swiss/dsp-das/actions?query=workflow%3ACI)
[![codecov](https://codecov.io/gh/dasch-swiss/dsp-das/branch/main/graph/badge.svg)](https://codecov.io/gh/dasch-swiss/dsp-das)

This monorepo hosts various libraries of the DaSCH Service Platform and it is built on:

- Nx - See [package.json](https://github.com/dasch-swiss/dsp-das/blob/main/package.json) for current version
- Angular - See [package.json](https://github.com/dasch-swiss/dsp-das/blob/main/package.json) for current version
- Node.js - Version managed via [.nvmrc](https://github.com/dasch-swiss/dsp-das/blob/main/.nvmrc) file

# Install libraries

To install all libraries and external dependencies just run `npm install`.

## Quick Commands

Most common operations for daily development:

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
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

For all available commands, see [package.json](https://github.com/dasch-swiss/dsp-das/blob/main/package.json).

## @dasch-swiss librairies

For more information about available libraries, see the VRE libraries under `libs/vre/` and the library path aliases in [tsconfig.base.json](https://github.com/dasch-swiss/dsp-das/blob/main/tsconfig.base.json).

## DSP-APP &mdash; generic user interface of DaSCH Service Platform

DSP (DaSCH Service Platform) is a software framework for storing, sharing, and
working with primary resources and data in the humanities.

DSP-APP is a simple user interface for the research data repository of the
Swiss National Data and Service Center for the Humanities (DaSCH), which uses
the [DSP-API](https://github.com/dasch-swiss/dsp-api) server application in the backend. It's a system for annotation and
linkage of resources in arts and humanities.

DSP-APP implements [DSP-JS](https://www.npmjs.com/package/@dasch-swiss/dsp-js)
to connect with [DSP-API](https://docs.dasch.swiss/latest/DSP-API/03-endpoints/api-v2/introduction/).

DSP-APP is [free software](http://www.gnu.org/philosophy/free-sw.en.html), released
under [GNU Affero General Public](http://www.gnu.org/licenses/agpl-3.0.en.html) license.

## User Quickstart

To try DSP-APP out the [DSP-API](https://github.com/dasch-swiss/dsp-api) backend should be started first:

In terminal go to DSP-API repository and start the API by running following commands:

```shell
$ make init-db-test
$ make stack-without-app
```

Once backend is up and running, in the second terminal instance start DSP-APP by running:

```shell
# come back to this repository and start the DSP-APP
$ npx nx run dsp-app:serve
```

## Developer Quickstart

It is recommended to use `Node.js` version which [is supported by installed Angular version](https://angular.dev/reference/versions).

The monorepo is implemented using [NX](https://nx.dev).

> **_NOTE:_** to run `nx` commands install it globally `npm install -g nx` or instead use `npx`.

### Working with Individual Libraries

The monorepo contains multiple libraries that can be developed independently. To work with specific libraries:

```bash
# Test a specific library
nx run [library-name]:test

# Build a specific library
nx run [library-name]:build

# Lint a specific library
nx run [library-name]:lint

# Example: Test the date-picker library
nx run vre-ui-date-picker:test
```

**Available libraries:**
- See [tsconfig.base.json](https://github.com/dasch-swiss/dsp-das/blob/main/tsconfig.base.json) for all library path aliases under the `paths` configuration
- Main VRE libraries are under `@dasch-swiss/vre/*` namespace

### OpenAPI Client Generation

For API client generation and maintenance:
- [OpenAPI Client Generation](https://github.com/dasch-swiss/dsp-das/blob/main/libs/vre/3rd-party-services/open-api/README.md) - Auto-generated TypeScript client for DSP-API

### IDE plugins

- https://plugins.jetbrains.com/plugin/15101-nx-console-idea
- https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console

### Local Observability

For local development, you can run a Grafana observability stack to view Faro telemetry data (logs, traces, Web Vitals):

```shell
$ npm run start-local-with-observability
```

This starts both the observability stack and the app. Access Grafana at [http://localhost:3001](http://localhost:3001) (credentials: `admin`/`admin`). The stack includes Loki for logs, Tempo for traces, and Mimir for metrics. To stop: `docker compose -f docker-compose.observability.yml down`

For detailed configuration and troubleshooting, see the inline documentation in `docker-compose.observability.yml` and `apps/dsp-app/src/config/config.dev.json`.

## CI/CD Workflows

The project uses GitHub Actions with three focused workflows:

- **CI** (`.github/workflows/ci.yml`) - Runs on PRs and main branch: linting, unit tests, E2E tests, OpenAPI validation, docs build
- **Deploy** (`.github/workflows/deploy.yml`) - Runs after CI passes on main or on tag pushes: Docker image publish, DEV deployment trigger, release notifications
- **Release** (`.github/workflows/release.yml`) - Automated release management with release-please on main branch

All workflows use `npm ci` with caching for fast, deterministic builds and include memory optimizations to prevent CI failures.

## Further Documentation

### Developer docs

➡ [for developers](https://docs.dasch.swiss/latest/DSP-APP/contribution)

## Contribution

If you would like to contribute to the development of the DSP-APP alongside us,
please follow the [general DSP contribution guidelines](https://docs.dasch.swiss/latest/developers/contribution/).

### Documentation

We built the developer documentation with [MkDocs](https://www.mkdocs.org/).
More information can be found in the specific [README](https://github.com/dasch-swiss/dsp-das/blob/main/docs/contribution/docs-documentation.md).
