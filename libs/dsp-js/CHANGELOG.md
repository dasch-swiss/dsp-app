# Changelog

## [12.1.0](https://github.com/dasch-swiss/dsp-app/compare/dsp-js-v12.0.1...dsp-js-v12.1.0) (2026-07-24)


### Enhancements

* add resource-side legal metadata UI (DEV-6663) ([#3178](https://github.com/dasch-swiss/dsp-app/issues/3178)) ([36e56e3](https://github.com/dasch-swiss/dsp-app/commit/36e56e3582c9ceaf9452b63a983739e5fa759d61))
* adopt matchFulltext in the redesigned advanced search (DEV-6715) ([#3235](https://github.com/dasch-swiss/dsp-app/issues/3235)) ([dae1363](https://github.com/dasch-swiss/dsp-app/commit/dae1363270282125cfb3e4602fd0c950eb3bfff5))
* display entities in the current language (DEV-6627) ([#3174](https://github.com/dasch-swiss/dsp-app/issues/3174)) ([1dae05a](https://github.com/dasch-swiss/dsp-app/commit/1dae05a370c7d24086ec14336f16e84504c9ce6c))
* multi-language list-node labels with reactive language switch (DEV-6555) ([#3211](https://github.com/dasch-swiss/dsp-app/issues/3211)) ([f2b418d](https://github.com/dasch-swiss/dsp-app/commit/f2b418d12415a7425c1f8f83d73d46f157c97857))
* translate advanced search and its displayed classes and properties (DEV-6645) ([#3177](https://github.com/dasch-swiss/dsp-app/issues/3177)) ([513cefe](https://github.com/dasch-swiss/dsp-app/commit/513cefe166c5b2d22f34220128843d57901ef9e6))


### Bug Fixes

* CJS interop fixes after application builder upgrade ([#3204](https://github.com/dasch-swiss/dsp-app/issues/3204)) ([2669888](https://github.com/dasch-swiss/dsp-app/commit/2669888b54f7342fecef1a4c0f99cc80a54197cf))


### Maintenances

* convert NX lint/test targets to inferred + align Node engines floor (DEV-6686) ([#3196](https://github.com/dasch-swiss/dsp-app/issues/3196)) ([d6ffc7b](https://github.com/dasch-swiss/dsp-app/commit/d6ffc7b1c1e7aaeef2f0596bc4dbdc13bb301afd))
* **deps:** update prettier 3.8.5 → 3.9.5 and reformat ([#3249](https://github.com/dasch-swiss/dsp-app/issues/3249)) ([1d1d94a](https://github.com/dasch-swiss/dsp-app/commit/1d1d94ab0598fd5708bef31e6d242501ae907a99))
* migrate dsp-app to ESLint 9 flat config + ts-eslint 8 (DEV-6685) ([#3190](https://github.com/dasch-swiss/dsp-app/issues/3190)) ([b8b7a7c](https://github.com/dasch-swiss/dsp-app/commit/b8b7a7ccae7e8538ff6ec91fcd49926d245cb893))
* upgrade Angular to v21 and NX to v23 (DEV-5699) ([#3189](https://github.com/dasch-swiss/dsp-app/issues/3189)) ([baef357](https://github.com/dasch-swiss/dsp-app/commit/baef357a0e1352798d731ca6c6917c259362848f))

## [12.0.1](https://github.com/dasch-swiss/dsp-app/compare/dsp-js-v12.0.0...dsp-js-v12.0.1) (2026-06-15)


### Bug Fixes

* streamline translations with current language (DEV-6607) ([#3115](https://github.com/dasch-swiss/dsp-app/issues/3115)) ([8b6bc68](https://github.com/dasch-swiss/dsp-app/commit/8b6bc68d656aeb6bef20ab81cbeea42cb64d3d86))

## [12.0.0](https://github.com/dasch-swiss/dsp-app/compare/dsp-js-v11.0.0...dsp-js-v12.0.0) (2026-04-24)


### ⚠ BREAKING CHANGES

* integrate dsp-js-lib into dsp-app monorepo ([#2900](https://github.com/dasch-swiss/dsp-app/issues/2900))

### Enhancements

* **property-value:** display list node description (DEV-5621) ([#2927](https://github.com/dasch-swiss/dsp-app/issues/2927)) ([b5f1b60](https://github.com/dasch-swiss/dsp-app/commit/b5f1b6021ea0b3934916e56dc04242a9f59f120f))


### Maintenances

* add storybook and stories on UI components ([#2958](https://github.com/dasch-swiss/dsp-app/issues/2958)) ([8094b65](https://github.com/dasch-swiss/dsp-app/commit/8094b650d9770146714be7df1bb77b923bb51f8f))
* audit and clean up deprecated/redundant dependencies ([#2991](https://github.com/dasch-swiss/dsp-app/issues/2991)) ([e0ddac8](https://github.com/dasch-swiss/dsp-app/commit/e0ddac86e87d0121ea971b41f7b297b2861d6c7c))
* **dsp-js:** align eslint rules ([#2923](https://github.com/dasch-swiss/dsp-app/issues/2923)) ([3e9067d](https://github.com/dasch-swiss/dsp-app/commit/3e9067d9454cd9745c7092ba42701c52dd03cd13))
* **dsp-js:** configure monorepo NPM publishing (DEV-6089) ([#2928](https://github.com/dasch-swiss/dsp-app/issues/2928)) ([f3cd427](https://github.com/dasch-swiss/dsp-app/commit/f3cd427d60168442cbf47a6ae0e82f46c582ca9a))
* integrate dsp-js-lib into dsp-app monorepo ([#2900](https://github.com/dasch-swiss/dsp-app/issues/2900)) ([2046176](https://github.com/dasch-swiss/dsp-app/commit/2046176aae7b9e5a9d78927ceac3335f961ed3ef))
* **main:** release dsp-js 11.0.0 ([#2931](https://github.com/dasch-swiss/dsp-app/issues/2931)) ([0614030](https://github.com/dasch-swiss/dsp-app/commit/06140304631cca08d1035cf3179954378f9374e8))
* remove yalc references after dsp-js integration ([#2919](https://github.com/dasch-swiss/dsp-app/issues/2919)) ([32f729c](https://github.com/dasch-swiss/dsp-app/commit/32f729cecf21a576509022afb1e9edd5895fdf0f))

## [11.0.0](https://github.com/dasch-swiss/dsp-app/compare/dsp-js-v10.10.1...dsp-js-v11.0.0) (2026-03-26)


### ⚠ BREAKING CHANGES

* integrate dsp-js-lib into dsp-app monorepo ([#2900](https://github.com/dasch-swiss/dsp-app/issues/2900))

### Enhancements

* **property-value:** display list node description (DEV-5621) ([#2927](https://github.com/dasch-swiss/dsp-app/issues/2927)) ([b5f1b60](https://github.com/dasch-swiss/dsp-app/commit/b5f1b6021ea0b3934916e56dc04242a9f59f120f))


### Maintenances

* **dsp-js:** align eslint rules ([#2923](https://github.com/dasch-swiss/dsp-app/issues/2923)) ([3e9067d](https://github.com/dasch-swiss/dsp-app/commit/3e9067d9454cd9745c7092ba42701c52dd03cd13))
* **dsp-js:** configure monorepo NPM publishing (DEV-6089) ([#2928](https://github.com/dasch-swiss/dsp-app/issues/2928)) ([f3cd427](https://github.com/dasch-swiss/dsp-app/commit/f3cd427d60168442cbf47a6ae0e82f46c582ca9a))
* integrate dsp-js-lib into dsp-app monorepo ([#2900](https://github.com/dasch-swiss/dsp-app/issues/2900)) ([2046176](https://github.com/dasch-swiss/dsp-app/commit/2046176aae7b9e5a9d78927ceac3335f961ed3ef))
* remove yalc references after dsp-js integration ([#2919](https://github.com/dasch-swiss/dsp-app/issues/2919)) ([32f729c](https://github.com/dasch-swiss/dsp-app/commit/32f729cecf21a576509022afb1e9edd5895fdf0f))
