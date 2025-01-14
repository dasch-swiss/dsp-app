# DaSCH Applications and Libraries Monorepo

[![Github](https://img.shields.io/github/v/tag/dasch-swiss/dsp-app?include_prereleases&label=Github%20tag)](https://github.com/dasch-swiss/dsp-das)
[![Docker](https://img.shields.io/docker/v/daschswiss/dsp-app?label=Docker%20image)](https://hub.docker.com/r/daschswiss/dsp-app)
[![CI](https://github.com/dasch-swiss/dsp-das/workflows/CI/badge.svg)](https://github.com/dasch-swiss/dsp-das/actions?query=workflow%3ACI)

This monorepo hosts various libraries of the DaSCH Service Platform and it is built on:
- Nx `v19.0.8`,
- Angular `v17.3.0`,
- Node.js `v20.9.0`.

# Install libraries

To install all libraries and external dependencies just run `npm install`.

## @dasch-swiss librairies

For more information about specific library, please go to its readme, e.g.:

- [@dasch-swiss/jdnconvertiblecalendar](https://github.com/dasch-swiss/dsp-das/blob/main/libs/jdnconvertiblecalendar/README.md)
- [@dasch-swiss/jdnconvertiblecalendardateadapter](https://github.com/dasch-swiss/dsp-das/blob/main/libs/jdnconvertiblecalendardateadapter/README.md)

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

In terminal fo to DSP-API repository and start the API by running following commands:
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

The most common commands are defined in `package.json`.

> **_NOTE:_** You can install `nx` globally with `npm install -g nx`. If not, then all `nx` commands below need to be prefixed with `npx`.

| nx                                                   | npm                       |
| ---------------------------------------------------- | ------------------------- |
| `nx run dsp-app:test`                                | `npm run test-local`      |
| `nx run dsp-app:test:ci`                             | `npm run test-ci`         |
| `nx run-many --all --target=test --configuration=ci` | `npm run test-ci-all`     |
| `nx run dsp-app:serve`                               | `npm run start-local`     |
| `nx run dsp-app:serve:test-server`                   | `npm run start-test`      |
| `nx run dsp-app:serve:dev-server`                    | `npm run start-dev`       |
| `nx run dsp-app:serve:ls-test-server`                | `npm run start-ls-test`   |
| `nx run dsp-app:serve:stage-server`                  | `npm run start-stage`     |
| `nx run dsp-app:serve:0845-test-server`              | `npm run start-0845-test` |
| `nx run dsp-app:lint`                                | `npm run lint-ci`         |
| `nx run dsp-app:lint --fix`                          | `npm run lint-local`      |
| `nx run dsp-app-e2e:e2e:development`                 | `npm run e2e-ci-dev`      |
| `nx run dsp-app-e2e:e2e:production`                  | `npm run e2e-ci`          |
| `nx run dsp-app:build`                               | `build`                   |
| `nx run dsp-app:build:production`                    | `build-prod`              |

| npx                                       | npm                 |
| ----------------------------------------- | ------------------- |
| `cd apps/dsp-app-e2e && npx cypress open` | `npm run e2e-local` |

### IDE plugins

- https://plugins.jetbrains.com/plugin/15101-nx-console-idea
- https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console

### E2E Tests

There are three NPM scripts to run the E2E tests:

- `npm run e2e-ci-dev` will run the E2E tests in the console in a development environment.
- `npm run e2e-ci` will run the E2E tests in the console in a production environment. This is the command run also on GitHub CI.
- `npm run e2e-local` will open the Cypress UI which will enable to run individual tests easily and see every step as it runs.

## Further Documentation

### User guide

➡ [for latest released version](https://docs.dasch.swiss/latest/DSP-APP/user-guide/)

### Developer docs

➡ [for developers](https://docs.dasch.swiss/latest/DSP-APP/contribution)

## Contribution

If you would like to contribute to the development of the DSP-APP alongside us,
please follow the [general DSP contribution guidelines](https://docs.dasch.swiss/latest/developers/contribution/).

### Documentation / User guidelines

We built the user guidelines and developer documentation with [MkDocs](https://www.mkdocs.org/).
More information can be found in the specific [README](https://github.com/dasch-swiss/dsp-app/blob/main/docs/contribution/docs-documentation.md).
