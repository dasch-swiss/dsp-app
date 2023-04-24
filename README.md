# DaSCH Applications and Libraries Monorepo

[![Github](https://img.shields.io/github/v/tag/dasch-swiss/dsp-app?include_prereleases&label=Github%20tag)](https://github.com/dasch-swiss/dsp-app)
[![Docker](https://img.shields.io/docker/v/daschswiss/dsp-app?label=Docker%20image)](https://hub.docker.com/r/daschswiss/dsp-app)
[![CI](https://github.com/dasch-swiss/dsp-app/workflows/CI/badge.svg)](https://github.com/dasch-swiss/dsp-app/actions?query=workflow%3ACI)

This monorepo host different applications and libraries of the DaSCH Service Platform.

## DSP-APP &mdash; Generic user interface of DaSCH Service Platform

This app is a simple user interface for the research data repository of the
Swiss National Data and Service Center for the Humanities (DaSCH), which uses
the DSP-API server application in the backend. It's a system for annotation and
linkage of resources in arts and humanities.

DSP-APP implements [DSP-JS-LIB](https://www.npmjs.com/package/@dasch-swiss/dsp-js-lib)
to connect with [DSP-API](https://docs.dasch.swiss/latest/DSP-API/03-endpoints/api-v2/introduction/).
DSP (DaSCH Service Platform) is a software framework for storing, sharing, and
working with primary resources and data in the humanities.

DSP-APP is [free software](http://www.gnu.org/philosophy/free-sw.en.html), released
under [GNU Affero General Public](http://www.gnu.org/licenses/agpl-3.0.en.html) license.

## User Quickstart

To try out DSP-APP you first need to start the backend [DSP-API](https://github.com/dasch-swiss/dsp-api):
```shell
# go the dsp-api repository in a terminal and start the api
$ make init-db-test
$ make stack-without-app

# come back to this repository and start the app
$ npx nx run dsp-app:serve
```

## Developer Quickstart

The monorepo is implemented using [NX](https://nx.dev).

The most common commands are defined in `package.json`.

> **_NOTE:_** You can install `nx` globally with `npm install -g nx`. If not, then all `nx` commands bellow need to be prefixed with `npx`.

| nx                                                            | npm                                 |
|---------------------------------------------------------------|-------------------------------------|
| `nx run dsp-app:test`                                         | `npm run test-local`                |
| `nx run dsp-app:test --watch=false --browsers=ChromeHeadless` | `npm run test-ci`                   |
| `nx run dsp-app:serve:test-server`                            | `npm run start-with-test-server`    |
| `nx run dsp-app:serve:ls-test-server`                         | `npm run start-with-ls-test-server` |
| `nx run dsp-app:serve:staging-server`                         | `npm run start-with-staging-server` |
| `nx run dsp-app:lint`                                         | `npm run lint-ci`                   |
| `nx run dsp-app:lint --fix`                                   | `npm run lint-local`                |
| `nx run dsp-app-e2e:e2e`                                      | `npm run e2e`                       |
| `nx run dsp-app-e2e:e2e-ci --webdriver-update=false`          | `npm run e2e-ci`                    |
| `nx run dsp-app:build`                                        | `build`                             |
| `nx run dsp-app:build:production`                             | `build-prod`                        |

### IDE plugins
- https://plugins.jetbrains.com/plugin/15101-nx-console-idea
- https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console


## Further Documentation

### User guide

➡ [for latest released version](https://docs.dasch.swiss/latest/DSP-APP/user-guide/)

### Developer docs

➡ [for developers](https://docs.dasch.swiss/latest/DSP-APP/contribution)

## Contribution

If you would like to contribute to the development of the DSP-APP alongside us,
please consult the [general DSP contribution guidelines](https://docs.dasch.swiss/latest/developers/dsp/contribution/).

### Documentation / User guidelines

We built the user guidelines and developer documentation with [MkDocs](https://www.mkdocs.org/).
Get more information in the appropriate [README](https://github.com/dasch-swiss/dsp-app/blob/main/docs/README.md).
