# DSP APP &mdash; Generic user interface of DaSCH Service Platform

[![GitHub version](https://badge.fury.io/gh/dasch-swiss%2Fdsp-app.svg)](https://github.com/dasch-swiss/dsp-app)
[![CI](https://github.com/dasch-swiss/dsp-app/workflows/CI/badge.svg)](https://github.com/dasch-swiss/dsp-app/actions?query=workflow%3ACI)
[![Docker](https://img.shields.io/docker/cloud/build/daschswiss/dsp-app)](https://hub.docker.com/r/daschswiss/dsp-app)

This app is a simple user interface for the Data and Service Center for the Humanities DaSCH, which uses the DSP-API/Knora server application in the backend. It's a system for annotation and linkage of resources in arts and humanities.

DSP-APP implements [DSP-JS-LIB](https://www.npmjs.com/package/@dasch-swiss/dsp-js) to connect with [DSP-API](https://docs.dasch.swiss/developers/knora/api-reference/). DSP-API is a software framework for storing, sharing, and working with primary resources and data in the humanities.

Additional it's built with [DSP-UI-LIB](https://www.npmjs.com/package/@dasch-swiss/dsp-ui) &mdash; reusable DSP specific Angular modules.

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

A new version will be published with each github release as it's part of Github actions' workflow. Please follow the steps below to prepare the next release:

- Create new branch from master called e.g. `prerelease/v1.0.0-rc.2` or `release/v2.0.0`
- Run one of the corresponding make commands:
  - `next-release-candidate`         updates version to next release candidate e.g. from 3.0.0-rc.0 to 3.0.0-rc.1 or from 3.0.0 to 3.0.1-rc.0
  - `prerelease-major`               updates version to next MAJOR as release candidate e.g. from 4.0.0 to 5.0.0-rc.0
  - `prerelease-minor`               updates version to next MINOR as release-candidate e.g. from 3.1.0 to 3.2.0-rc.0
  - `prerelease-patch`               updates version to next PATCH as release-candidate e.g. from 3.0.1 to 3.0.2-rc.0
  - `release-major`                  updates version to next MAJOR version e.g. from 3.0.0 to 4.0.0
  - `release-minor`                  updates version to next MINOR version e.g. from 3.0.0 to 3.1.0
  - `release-patch`                  updates version to next PATCH version e.g. from 3.0.0 to 3.0.1
- The make command will commit and push to github (you have to fill in your GitHub username and password to log when you do not use any [github token](https://docs.github.com/en/enterprise/2.15/user/articles/creating-a-personal-access-token-for-the-command-line))
- Update README and CHANGELOG if necessary and commit the changes (currently, the CHANGELOG has to be updated manually)
- Create new pull request and merge into master
- Draft new release on Github. This will build, test and publish the new package on dockerhub. Additional it creates / overrides release notes on Github. Fill in:
  - the tag version, the release title (same name)
  - If this is a pre-release, check the box "This is a pre-release"

New package will be available on <https://hub.docker.com/repository/docker/daschswiss/dsp-app>.
