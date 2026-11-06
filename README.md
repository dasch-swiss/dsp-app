# DaSCH Applications and Libraries Monorepo

[![Github](https://img.shields.io/github/v/tag/dasch-swiss/dsp-app?include_prereleases&label=Github%20tag)](https://github.com/dasch-swiss/dsp-app)
[![Docker](https://img.shields.io/docker/v/daschswiss/dsp-app?label=Docker%20image)](https://hub.docker.com/r/daschswiss/dsp-app)
[![CI](https://github.com/dasch-swiss/dsp-app/workflows/CI/badge.svg)](https://github.com/dasch-swiss/dsp-app/actions?query=workflow%3ACI)
[![codecov](https://codecov.io/gh/dasch-swiss/dsp-app/branch/main/graph/badge.svg)](https://codecov.io/gh/dasch-swiss/dsp-app)

DSP-APP is the user interface for the [DaSCH Service Platform](https://dasch.swiss) — a software framework for storing, sharing, and working with primary resources and data in the humanities. It connects to [DSP-API](https://github.com/dasch-swiss/dsp-api) via [DSP-JS](libs/dsp-js/) and is released under the [GNU Affero General Public License](http://www.gnu.org/licenses/agpl-3.0.en.html).

This monorepo is built on:

- **Nx** — See [package.json](https://github.com/dasch-swiss/dsp-app/blob/main/package.json) for current version
- **Angular** — See [package.json](https://github.com/dasch-swiss/dsp-app/blob/main/package.json) for current version
- **Node.js** — Version pinned in `MODULE.bazel`

## Quick Start

Enter the Nix dev shell from the repository root (`nix develop`, or automatically through direnv); it
provides Bazel, just, pnpm and Node. Then:

```shell
just install   # npm dependencies from pnpm-lock.yaml
just test      # every Bazel test target
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

| Task                            | Command                                  |
|---------------------------------|------------------------------------------|
| List every recipe               | `just help`                              |
| Run the Bazel tests             | `just test`                              |
| Run the tests a change affects  | `just test-files -- <paths>`             |
| Lint all projects               | `just lint`                              |
| Run the CI gate                 | `just ci`                                |
| Open E2E tests UI               | `pnpm run e2e-local`                     |
| Browse all component stories    | `just storybook`                         |
| Build static Storybook          | `just storybook-build`                   |
| Run Storybook interaction tests | `just storybook-test`                    |

For all available commands, see the [justfile](https://github.com/dasch-swiss/dsp-app/blob/main/justfile).

## Developer Guide

### Working with Individual Libraries

A library built by Bazel is tested with `just test //<package>/...`, for example
`just test //libs/dsp-js/...`.

Library path aliases are defined in [tsconfig.base.json](https://github.com/dasch-swiss/dsp-app/blob/main/tsconfig.base.json) under `paths`. Main VRE libraries use the `@dasch-swiss/vre/*` namespace.

### OpenAPI Client Generation

The TypeScript client for DSP-API is auto-generated from the OpenAPI spec:

```shell
just openapi-check     # Check if the vendored spec matches the dev API's
just openapi-update    # Update the spec and regenerate the client
just openapi-generate  # Regenerate from the local spec only
```

Bazel generates the client in a build action; `just openapi-generate` also copies it to the gitignored
`src/generated` for the IDE.

See [OpenAPI Client README](https://github.com/dasch-swiss/dsp-app/blob/main/libs/vre/3rd-party-services/open-api/README.md) for full details.

### IDE Plugins

- [Nx Console for JetBrains](https://plugins.jetbrains.com/plugin/15101-nx-console-idea)
- [Nx Console for VS Code](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console)

### Local Observability

Run a Grafana stack alongside the app to view Faro telemetry (logs, traces, Web Vitals):

```shell
docker compose -f docker-compose.observability.yml up -d
```

Grafana is available at [http://localhost:3001](http://localhost:3001) (credentials: `admin`/`admin`). Includes Loki (logs), Tempo (traces), and Mimir (metrics).

To stop: `docker compose -f docker-compose.observability.yml down`

## Storybook

A single global [Storybook](https://storybook.js.org/) instance aggregates stories from all libraries and apps:

```shell
just storybook               # Serve the Bazel-built Storybook (http://localhost:4400)
just storybook-build         # Build it to bazel-bin/storybook/
just storybook-test          # Build, serve and run the story interaction tests
```

Stories are auto-discovered from any `*.stories.ts` file under `libs/` or `apps/` — no registration needed when adding new stories.

## Issues & Contributions

- [Developer docs](https://docs.dasch.swiss/DSP-APP/contribution)

To report an issue or contribute, contact us at [support@dasch.swiss](mailto:support@dasch.swiss).
