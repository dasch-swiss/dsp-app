# DSP APP &mdash; Generic user interface of DaSCH Service Platform

[![Github](https://img.shields.io/github/v/tag/dasch-swiss/dsp-app?include_prereleases&label=Github%20tag)](https://github.com/dasch-swiss/dsp-app)
[![Docker](https://img.shields.io/docker/v/daschswiss/dsp-app?label=Docker%20image)](https://hub.docker.com/r/daschswiss/dsp-app)
[![CI](https://github.com/dasch-swiss/dsp-app/workflows/CI/badge.svg)](https://github.com/dasch-swiss/dsp-app/actions?query=workflow%3ACI)

This app is a simple user interface for the Data and Service Center for the Humanities DaSCH, which uses the DSP-API/Knora server application in the backend. It's a system for annotation and linkage of resources in arts and humanities.

DSP-APP implements [DSP-JS-LIB](https://www.npmjs.com/package/@dasch-swiss/dsp-js) to connect with [DSP-API](https://docs.dasch.swiss/developers/knora/api-reference/). DSP-API is a software framework for storing, sharing, and working with primary resources and data in the humanities.

Additionaly it's built with [DSP-UI-LIB](https://www.npmjs.com/package/@dasch-swiss/dsp-ui) &mdash; reusable DSP specific Angular modules.

Please check our [DSP Release Compatibility Matrix](https://docs.google.com/spreadsheets/d/e/2PACX-1vQe-0nFKqYHwHT3cNI2M_ZCycKOgDZBxtaabxEQDDkNKJf6funMVrJBJPgMFEJdiBdCesahUhURN6MS/pubhtml) to use this app with the correct and required versions of the dependent packages.

DSP-APP is [free software](http://www.gnu.org/philosophy/free-sw.en.html), released under [GNU Affero General Public](http://www.gnu.org/licenses/agpl-3.0.en.html) license.

## Development server

Run `ng serve` for a dev server. Navigate to `http://0.0.0.0:4200/`. The app will automatically reload if you change any of the resource files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can
also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Documentation / User guidelines

We built the user guidelines and developer documentation with [MkDocs](https://www.mkdocs.org/) in a separate [repository](https://github.com/dasch-swiss/dsp-docs). The user guide is published on [docs.dasch.swiss/user-guide](https://docs.dasch.swiss/user-guide).

## Publish a new version to DockerHub

Before publishing:

- Update README if necessary and commit the changes.

- Be sure that all dependencies to DSP-UI-LIB, DSP-JS-LIB and DSP-API are set to the correct version.

A new version will be published with each Github release as it's part of Github actions' workflow. To make a new release, go to <https://github.com/dasch-swiss/dsp-app/releases> and update the draft called "Next release" by changing:

- The tag version and the release title (same name) with the version number, e.g. `v3.0.0` or `v3.0.0-rc.0`
- If this is a pre-release, check the box "This is a pre-release"

New package will be available on <https://hub.docker.com/repository/docker/daschswiss/dsp-app>.
