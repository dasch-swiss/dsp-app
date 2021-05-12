# DSP-APP &mdash; Generic user interface of DaSCH Service Platform

[![Github](https://img.shields.io/github/v/tag/dasch-swiss/dsp-app?include_prereleases&label=Github%20tag)](https://github.com/dasch-swiss/dsp-app)
[![Docker](https://img.shields.io/docker/v/daschswiss/dsp-app?label=Docker%20image)](https://hub.docker.com/r/daschswiss/dsp-app)
[![CI](https://github.com/dasch-swiss/dsp-app/workflows/CI/badge.svg)](https://github.com/dasch-swiss/dsp-app/actions?query=workflow%3ACI)

> **_NOTE:_**  The current DSP-APP version presents the **admin view** only.

This app is a simple user interface for the Data and Service Center for the Humanities DaSCH, which uses the DSP-API server application in the backend. It's a system for annotation and linkage of resources in arts and humanities.

DSP-APP implements [DSP-JS-LIB](https://www.npmjs.com/package/@dasch-swiss/dsp-js) to connect with [DSP-API](https://docs.dasch.swiss/developers/knora/api-reference/). DSP (DaSCH Service Platform) is a software framework for storing, sharing, and working with primary resources and data in the humanities.

Additionaly it's built with [DSP-UI-LIB](https://www.npmjs.com/package/@dasch-swiss/dsp-ui) &mdash; reusable DSP specific Angular modules.

Please check our [DSP Release Compatibility Matrix](https://docs.google.com/spreadsheets/d/e/2PACX-1vQe-0nFKqYHwHT3cNI2M_ZCycKOgDZBxtaabxEQDDkNKJf6funMVrJBJPgMFEJdiBdCesahUhURN6MS/pubhtml) to use this app with the correct and required versions of the dependent packages.

DSP-APP is [free software](http://www.gnu.org/philosophy/free-sw.en.html), released under [GNU Affero General Public](http://www.gnu.org/licenses/agpl-3.0.en.html) license.

## Documentation

### User guide

➡ [for current deployed version](https://docs.dasch.swiss/user-guide/)

➡ [for development version](https://dasch-swiss.github.io/dsp-app/how-to-use)

### Developer docs

➡ [for developers](https://dasch-swiss.github.io/dsp-app/how-to-contribute)

## Contribution

If you would like to contribute to the development of the DSP-APP alongside us, please consult the  [general DSP contribution guidelines](https://docs.dasch.swiss/developers/dsp/contribution/).

### Work on GitHub

DSP-APP has two main branches at the moment:

#### "main" branch

- use the branch "main" to work on the DSP-ADMIN app. Any changes should be created in branches from "main" and should be merged into the "main" branch.

#### "develop" branch

- use the branch "develop" to work on the whole DSP-APP app (admin + research parts). Any new developments should be created in branches from "develop" and should be merged into the "develop" branch.

### Documentation / User guidelines

We built the user guidelines and developer documentation with [MkDocs](https://www.mkdocs.org/). Get more information in the appropriate [README](https://github.com/dasch-swiss/dsp-app/blob/main/docs/README.md).
