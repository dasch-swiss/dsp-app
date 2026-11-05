# Build Baselines

The numbers the build-system migration (DEV-7767) is compared against. A later run that differs
from them is a defect to explain, not a new baseline.

## How the numbers are produced

| Number | Command |
| ------ | ------- |
| Passing spec files, passing and skipped tests per library | `scripts/test-counts.sh` |
| Bundle inventory | `pnpm exec nx build dsp-app`, then `scripts/bundle-inventory.sh dist/apps/dsp-app` |
| Hash of a generated tree | `scripts/tree-hash.sh <dir>` |
| Stories | `pnpm run build-storybook`, then the `type: story` entries of `dist/storybook/index.json` |
| Storybook interaction tests | `pnpm run test-storybook` against that build, served on its port |
| Cypress specs | `find apps/dsp-app/cypress -name '*.cy.ts'` |

`scripts/bundle-inventory.sh` replaces the content hash in a file name with `[hash]`, so two builds
of different sources list the same names.

## When two runs match

- **Test counts:** every line equal.
- **Two Angular CLI bundles:** the normalized file list is equal and the total size is within
  10 percent.
- **The Angular CLI bundle against a Bazel bundle:** the initial files (`main`, `polyfills`,
  `styles`) are each within 10 percent, and the number of lazy chunks is equal. Chunk names and
  splitting differ between the two bundlers, so nothing else is compared.

## Reference: before the migration

Commit `5fbfcf895` (`main`, release 14.1.2), darwin-arm64, Node 22.23.2, 2026-11-05.

### Test counts

The one skipped test is an `it.skip` in `link-value.component.spec.ts`.

```text
library	spec_files_passed	tests_passed	tests_skipped
apps/dsp-app	3	8	0
libs/dsp-js	28	311	0
libs/vre/3rd-party-services/analytics	2	37	0
libs/vre/3rd-party-services/api	1	1	0
libs/vre/3rd-party-services/open-api	1	13	0
libs/vre/core/config	2	9	0
libs/vre/core/error-handler	4	86	0
libs/vre/core/session	5	64	0
libs/vre/pages/data-browser	9	170	0
libs/vre/pages/ontology/list	1	1	0
libs/vre/pages/ontology/ontology	1	1	0
libs/vre/pages/project/project	30	361	0
libs/vre/pages/search/advanced-search	4	78	0
libs/vre/pages/search/search	1	8	0
libs/vre/pages/search/search-filters	14	294	0
libs/vre/pages/system/system	1	5	0
libs/vre/pages/user-settings/user	0	0	0
libs/vre/resource-editor/resource-editor	56	478	1
libs/vre/shared/app-common	3	85	0
libs/vre/shared/app-common-to-move	3	68	0
libs/vre/shared/app-help-page	2	10	0
libs/vre/shared/app-helper-services	4	47	0
libs/vre/shared/calendar	8	367	0
libs/vre/ui/date-picker	3	156	0
libs/vre/ui/nested-menu	0	0	0
libs/vre/ui/notification	1	1	0
libs/vre/ui/progress-indicator	1	3	0
libs/vre/ui/string-literal	2	14	0
libs/vre/ui/ui	12	134	0
total	202	2810	1
```

### Bundle inventory

Production configuration. Initial files: `main` 920249 bytes, `polyfills` 35897, `styles` 114015,
`scripts` 349228. The 24 `chunk-` files are 8 initial and 16 lazy chunks; 4 of the lazy ones are
empty stubs for Node modules.

```text
3rdpartylicenses.txt	305649
assets/fonts/material-icons/MaterialIcons-Regular.ttf	356840
assets/fonts/roboto/roboto-v29-latin-300.woff2	15732
assets/fonts/roboto/roboto-v29-latin-500.woff2	15920
assets/fonts/roboto/roboto-v29-latin-700.woff2	15828
assets/fonts/roboto/roboto-v29-latin-italic.woff2	17304
assets/fonts/roboto/roboto-v29-latin-regular.woff2	15688
assets/i18n/CLAUDE.md	6911
assets/i18n/README.md	844
assets/i18n/de.json	58515
assets/i18n/en.json	53218
assets/i18n/fr.json	60055
assets/i18n/it.json	57321
assets/icons/dasch-fingerprint.svg	16549
assets/images/cc-license.png	6248
assets/images/dasch-icon-black.svg	13478
assets/images/dasch-icon-purple.svg	13478
assets/images/dasch-icon-white.svg	13478
assets/images/dasch-mosaic-icon-color.svg	13670
assets/images/decimal-icon.svg	2201
assets/images/draw-region-icon.svg	1748
assets/images/dsp-error-403.svg	194520
assets/images/dsp-error-404.svg	191919
assets/images/dsp-error-500.svg	207722
assets/images/dsp-error-503.svg	209295
assets/images/dsp-error.svg	155800
assets/images/integer-icon.svg	1559
assets/images/knora-icon.svg	1879
assets/images/logo-dasch.jpg	88555
assets/images/logo-sagw.jpg	40709
assets/images/logo-snf-fns.jpg	13927
assets/images/logo-swissuniversities.svg	4313
assets/images/logo-unibas.jpg	53048
assets/images/logo-unil.jpg	61009
assets/images/lp-bg-1.jpg	391127
assets/images/lp-bg-2.jpg	790459
assets/images/preview-not-available.png	11822
assets/images/project-tile-bg.jpg	7445
assets/images/project/CLAUDE.md	873
assets/images/project/width-500/0102.webp	12014
assets/images/project/width-500/0103.webp	66042
assets/images/project/width-500/0105.webp	61448
assets/images/project/width-500/0106.webp	28160
assets/images/project/width-500/0107.webp	12950
assets/images/project/width-500/0108.webp	5764
assets/images/project/width-500/0111.webp	25128
assets/images/project/width-500/0112.webp	21104
assets/images/project/width-500/0113.webp	4386
assets/images/project/width-500/0114.webp	33764
assets/images/project/width-500/0116.webp	39826
assets/images/project/width-500/0117.webp	42502
assets/images/project/width-500/0118.webp	92944
assets/images/project/width-500/0119.webp	64948
assets/images/project/width-500/0120.webp	19282
assets/images/project/width-500/0121.webp	43450
assets/images/project/width-500/0801.webp	30396
assets/images/project/width-500/0803.webp	33950
assets/images/project/width-500/0804.webp	37988
assets/images/project/width-500/0805.webp	22310
assets/images/project/width-500/0806.webp	43962
assets/images/project/width-500/0807.webp	10220
assets/images/project/width-500/080C.webp	33208
assets/images/project/width-500/080E.webp	12234
assets/images/project/width-500/0810.webp	35378
assets/images/project/width-500/0811.webp	33936
assets/images/project/width-500/0812.webp	26164
assets/images/project/width-500/0813.webp	11740
assets/images/project/width-500/0816.webp	21286
assets/images/project/width-500/081C.webp	27208
assets/images/project/width-500/0820.webp	28056
assets/images/project/width-500/0827.webp	29718
assets/images/project/width-500/0828.webp	51704
assets/images/project/width-500/082A.webp	18512
assets/images/project/width-500/082B.webp	28658
assets/images/project/width-500/082C.webp	13164
assets/images/project/width-500/082D.webp	50212
assets/images/project/width-500/0836.webp	19724
assets/images/project/width-500/0838.webp	45484
assets/images/project/width-500/083B.webp	9194
assets/images/project/width-500/083C.webp	20942
assets/images/project/width-500/083E.webp	45202
assets/images/project/width-500/0844.webp	49280
assets/images/project/width-500/0845.webp	13984
assets/images/project/width-500/0846.webp	29540
assets/images/project/width-500/0847.webp	21470
assets/images/project/width-500/0848.webp	23516
assets/images/project/width-500/0849.webp	11178
assets/images/project/width-500/084A.webp	13056
assets/images/project/width-500/084B.webp	33566
assets/images/project/width-500/084C.webp	38574
assets/images/project/width-500/084D.webp	46706
assets/images/project/width-500/084E.webp	17178
assets/images/project/width-500/0850.webp	29880
assets/images/project/width-500/0852.webp	15748
assets/images/project/width-500/0853.webp	32680
assets/images/project/width-500/0854.webp	50728
assets/images/project/width-500/0857.webp	39580
assets/images/project/width-500/085A.webp	36232
assets/images/project/width-500/085C.webp	18278
assets/images/project/width-500/085D.webp	16106
assets/images/project/width-500/085E.webp	6962
assets/images/project/width-500/085F.webp	69742
assets/images/project/width-500/0860.webp	26420
assets/images/project/width-500/0861.webp	14314
assets/images/project/width-500/0862.webp	39030
assets/images/project/width-500/0868.webp	31106
assets/images/project/width-500/0869.webp	1862
assets/images/project/width-500/086A.webp	15390
assets/images/project/width-500/8055.webp	39856
assets/test-data/api-error-0.json	1980
assets/test-data/api-error-500.json	2249
chunk-[hash].js	0
chunk-[hash].js	0
chunk-[hash].js	0
chunk-[hash].js	0
chunk-[hash].js	163
chunk-[hash].js	197
chunk-[hash].js	241
chunk-[hash].js	721
chunk-[hash].js	1914
chunk-[hash].js	2633
chunk-[hash].js	2985
chunk-[hash].js	5987
chunk-[hash].js	9553
chunk-[hash].js	10130
chunk-[hash].js	19040
chunk-[hash].js	23350
chunk-[hash].js	59716
chunk-[hash].js	83817
chunk-[hash].js	91466
chunk-[hash].js	115761
chunk-[hash].js	245467
chunk-[hash].js	459363
chunk-[hash].js	1345431
chunk-[hash].js	3560378
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	16643
chunk-[hash].js.map	41712
chunk-[hash].js.map	43998
chunk-[hash].js.map	58159
chunk-[hash].js.map	114679
chunk-[hash].js.map	344906
chunk-[hash].js.map	364578
chunk-[hash].js.map	378188
chunk-[hash].js.map	567920
chunk-[hash].js.map	1890194
chunk-[hash].js.map	2344060
chunk-[hash].js.map	4659255
chunk-[hash].js.map	10944376
config/build.json	28
config/config.dev-server.json	989
config/config.dev.json	1027
config/config.ls-test-server.json	968
config/config.prod.json	889
config/config.stage-server.json	934
favicon.ico	15406
index.html	58241
main-[hash].js	920249
main-[hash].js.map	2792954
media/MaterialIcons-Regular-[hash].ttf	356840
media/roboto-v29-latin-300-[hash].woff2	15732
media/roboto-v29-latin-500-[hash].woff2	15920
media/roboto-v29-latin-700-[hash].woff2	15828
media/roboto-v29-latin-italic-[hash].woff2	17304
media/roboto-v29-latin-regular-[hash].woff2	15688
polyfills-[hash].js	35897
polyfills-[hash].js.map	158141
prerendered-routes.json	18
scripts-[hash].js	349228
scripts-[hash].js.map	686188
styles-[hash].css	114015
files	181
bytes	38967597
```

## Reference: after the switch to pnpm

Commit `535bd182b` (Phase 3), darwin-arm64, Node 24.20.0 (the dev shell's `nodejs_24`), pnpm
10.33.2, 2026-11-05.

### Test counts

Equal to the reference before the migration, line for line.

```text
library	spec_files_passed	tests_passed	tests_skipped
apps/dsp-app	3	8	0
libs/dsp-js	28	311	0
libs/vre/3rd-party-services/analytics	2	37	0
libs/vre/3rd-party-services/api	1	1	0
libs/vre/3rd-party-services/open-api	1	13	0
libs/vre/core/config	2	9	0
libs/vre/core/error-handler	4	86	0
libs/vre/core/session	5	64	0
libs/vre/pages/data-browser	9	170	0
libs/vre/pages/ontology/list	1	1	0
libs/vre/pages/ontology/ontology	1	1	0
libs/vre/pages/project/project	30	361	0
libs/vre/pages/search/advanced-search	4	78	0
libs/vre/pages/search/search	1	8	0
libs/vre/pages/search/search-filters	14	294	0
libs/vre/pages/system/system	1	5	0
libs/vre/pages/user-settings/user	0	0	0
libs/vre/resource-editor/resource-editor	56	478	1
libs/vre/shared/app-common	3	85	0
libs/vre/shared/app-common-to-move	3	68	0
libs/vre/shared/app-help-page	2	10	0
libs/vre/shared/app-helper-services	4	47	0
libs/vre/shared/calendar	8	367	0
libs/vre/ui/date-picker	3	156	0
libs/vre/ui/nested-menu	0	0	0
libs/vre/ui/notification	1	1	0
libs/vre/ui/progress-indicator	1	3	0
libs/vre/ui/string-literal	2	14	0
libs/vre/ui/ui	12	134	0
total	202	2810	1
```

### Bundle inventory

Production configuration. The normalized file list equals the reference before the migration; the
total is 0.5 percent smaller. Initial files: `main` 905191 bytes, `polyfills` 35897, `styles`
114015, `scripts` 349228. 8 initial and 16 lazy chunks, as before.

```text
3rdpartylicenses.txt	294155
assets/fonts/material-icons/MaterialIcons-Regular.ttf	356840
assets/fonts/roboto/roboto-v29-latin-300.woff2	15732
assets/fonts/roboto/roboto-v29-latin-500.woff2	15920
assets/fonts/roboto/roboto-v29-latin-700.woff2	15828
assets/fonts/roboto/roboto-v29-latin-italic.woff2	17304
assets/fonts/roboto/roboto-v29-latin-regular.woff2	15688
assets/i18n/CLAUDE.md	6911
assets/i18n/README.md	844
assets/i18n/de.json	58515
assets/i18n/en.json	53218
assets/i18n/fr.json	60055
assets/i18n/it.json	57321
assets/icons/dasch-fingerprint.svg	16549
assets/images/cc-license.png	6248
assets/images/dasch-icon-black.svg	13478
assets/images/dasch-icon-purple.svg	13478
assets/images/dasch-icon-white.svg	13478
assets/images/dasch-mosaic-icon-color.svg	13670
assets/images/decimal-icon.svg	2201
assets/images/draw-region-icon.svg	1748
assets/images/dsp-error-403.svg	194520
assets/images/dsp-error-404.svg	191919
assets/images/dsp-error-500.svg	207722
assets/images/dsp-error-503.svg	209295
assets/images/dsp-error.svg	155800
assets/images/integer-icon.svg	1559
assets/images/knora-icon.svg	1879
assets/images/logo-dasch.jpg	88555
assets/images/logo-sagw.jpg	40709
assets/images/logo-snf-fns.jpg	13927
assets/images/logo-swissuniversities.svg	4313
assets/images/logo-unibas.jpg	53048
assets/images/logo-unil.jpg	61009
assets/images/lp-bg-1.jpg	391127
assets/images/lp-bg-2.jpg	790459
assets/images/preview-not-available.png	11822
assets/images/project-tile-bg.jpg	7445
assets/images/project/CLAUDE.md	873
assets/images/project/width-500/0102.webp	12014
assets/images/project/width-500/0103.webp	66042
assets/images/project/width-500/0105.webp	61448
assets/images/project/width-500/0106.webp	28160
assets/images/project/width-500/0107.webp	12950
assets/images/project/width-500/0108.webp	5764
assets/images/project/width-500/0111.webp	25128
assets/images/project/width-500/0112.webp	21104
assets/images/project/width-500/0113.webp	4386
assets/images/project/width-500/0114.webp	33764
assets/images/project/width-500/0116.webp	39826
assets/images/project/width-500/0117.webp	42502
assets/images/project/width-500/0118.webp	92944
assets/images/project/width-500/0119.webp	64948
assets/images/project/width-500/0120.webp	19282
assets/images/project/width-500/0121.webp	43450
assets/images/project/width-500/0801.webp	30396
assets/images/project/width-500/0803.webp	33950
assets/images/project/width-500/0804.webp	37988
assets/images/project/width-500/0805.webp	22310
assets/images/project/width-500/0806.webp	43962
assets/images/project/width-500/0807.webp	10220
assets/images/project/width-500/080C.webp	33208
assets/images/project/width-500/080E.webp	12234
assets/images/project/width-500/0810.webp	35378
assets/images/project/width-500/0811.webp	33936
assets/images/project/width-500/0812.webp	26164
assets/images/project/width-500/0813.webp	11740
assets/images/project/width-500/0816.webp	21286
assets/images/project/width-500/081C.webp	27208
assets/images/project/width-500/0820.webp	28056
assets/images/project/width-500/0827.webp	29718
assets/images/project/width-500/0828.webp	51704
assets/images/project/width-500/082A.webp	18512
assets/images/project/width-500/082B.webp	28658
assets/images/project/width-500/082C.webp	13164
assets/images/project/width-500/082D.webp	50212
assets/images/project/width-500/0836.webp	19724
assets/images/project/width-500/0838.webp	45484
assets/images/project/width-500/083B.webp	9194
assets/images/project/width-500/083C.webp	20942
assets/images/project/width-500/083E.webp	45202
assets/images/project/width-500/0844.webp	49280
assets/images/project/width-500/0845.webp	13984
assets/images/project/width-500/0846.webp	29540
assets/images/project/width-500/0847.webp	21470
assets/images/project/width-500/0848.webp	23516
assets/images/project/width-500/0849.webp	11178
assets/images/project/width-500/084A.webp	13056
assets/images/project/width-500/084B.webp	33566
assets/images/project/width-500/084C.webp	38574
assets/images/project/width-500/084D.webp	46706
assets/images/project/width-500/084E.webp	17178
assets/images/project/width-500/0850.webp	29880
assets/images/project/width-500/0852.webp	15748
assets/images/project/width-500/0853.webp	32680
assets/images/project/width-500/0854.webp	50728
assets/images/project/width-500/0857.webp	39580
assets/images/project/width-500/085A.webp	36232
assets/images/project/width-500/085C.webp	18278
assets/images/project/width-500/085D.webp	16106
assets/images/project/width-500/085E.webp	6962
assets/images/project/width-500/085F.webp	69742
assets/images/project/width-500/0860.webp	26420
assets/images/project/width-500/0861.webp	14314
assets/images/project/width-500/0862.webp	39030
assets/images/project/width-500/0868.webp	31106
assets/images/project/width-500/0869.webp	1862
assets/images/project/width-500/086A.webp	15390
assets/images/project/width-500/8055.webp	39856
assets/test-data/api-error-0.json	1980
assets/test-data/api-error-500.json	2249
chunk-[hash].js	0
chunk-[hash].js	0
chunk-[hash].js	0
chunk-[hash].js	0
chunk-[hash].js	163
chunk-[hash].js	197
chunk-[hash].js	241
chunk-[hash].js	657
chunk-[hash].js	721
chunk-[hash].js	2029
chunk-[hash].js	2796
chunk-[hash].js	3064
chunk-[hash].js	5987
chunk-[hash].js	9445
chunk-[hash].js	10130
chunk-[hash].js	19034
chunk-[hash].js	25143
chunk-[hash].js	84877
chunk-[hash].js	100050
chunk-[hash].js	101988
chunk-[hash].js	249161
chunk-[hash].js	435262
chunk-[hash].js	1345431
chunk-[hash].js	3561339
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	93
chunk-[hash].js.map	16643
chunk-[hash].js.map	41028
chunk-[hash].js.map	44743
chunk-[hash].js.map	58159
chunk-[hash].js.map	124285
chunk-[hash].js.map	184717
chunk-[hash].js.map	348295
chunk-[hash].js.map	391045
chunk-[hash].js.map	474093
chunk-[hash].js.map	1905663
chunk-[hash].js.map	2526689
chunk-[hash].js.map	4659313
chunk-[hash].js.map	10944504
config/build.json	28
config/config.dev-server.json	989
config/config.dev.json	1027
config/config.ls-test-server.json	968
config/config.prod.json	889
config/config.stage-server.json	934
favicon.ico	15406
index.html	58241
main-[hash].js	905191
main-[hash].js.map	2765069
media/MaterialIcons-Regular-[hash].ttf	356840
media/roboto-v29-latin-300-[hash].woff2	15732
media/roboto-v29-latin-500-[hash].woff2	15920
media/roboto-v29-latin-700-[hash].woff2	15828
media/roboto-v29-latin-italic-[hash].woff2	17304
media/roboto-v29-latin-regular-[hash].woff2	15688
polyfills-[hash].js	35897
polyfills-[hash].js.map	158108
prerendered-routes.json	18
scripts-[hash].js	349228
scripts-[hash].js.map	686188
styles-[hash].css	114015
files	181
bytes	38783038
```

### Storybook, Cypress and the generated client

| Number | Value |
| ------ | ----- |
| Stories in `dist/storybook/index.json` | 811 |
| Interaction tests (`test-storybook`) | 273 suites, 811 tests, all passed |
| `apps/dsp-app/cypress/**/*.cy.ts` | 22 |
| `scripts/tree-hash.sh` over `libs/vre/3rd-party-services/open-api/src/generated` (190 files) | `ef4bbe1532c390971f02dae02b9fa15f5899dd96f8f25ce65beb63e50704c726` |

### Pixeleye under the `playwright-core` 1.59.0 hold

The `@pixeleye/cli-install>playwright-core` override resolves 1.59.0 for that package alone, and
importing it raises no `ERR_PACKAGE_PATH_NOT_EXPORTED`. Pixeleye uses two Playwright versions:

- `pixeleye` runs `@pixeleye/cli-install`'s `installBrowsers()` each time it starts its snapshot
  server, which downloads Chromium, Firefox and WebKit for 1.59.0 (chromium v1217) and runs
  `installDeps`. It needs a writable browser directory.
- `@pixeleye/cli-capture` launches the browser through the root `playwright-core`, 1.61.1
  (chromium v1228), the `playwright-driver` version of the locked nixpkgs, so its browser can
  come from the Nix shell.

CI run 42118134666 (Node 24.22.1) captured 811 stories and 24 breakpoint stories with that
split, the CLI downloading its own 1.59.0 browsers. Phase 9 therefore gives the Pixeleye job a
writable `PLAYWRIGHT_BROWSERS_PATH`, not the read-only Nix store path: the CLI's own 1.59.0
download, plus chromium-headless-shell for 1.61.1 from the Nix browsers or from
`playwright-core install`.

## Vendored packages

`vendor/ckeditor5-custom-build-2.1.5.tgz` is `npm pack --ignore-scripts` of the `v2.1.5` tag
(`b107287f9`) of dasch-swiss/ckeditor_custom_build: 1876083 bytes, sha256
`5f5df5b4d3d02182a58ba864287973b23f550adf3f4e2b12b9231950c80c3020`. `pnpm-lock.yaml` records its
integrity (`sha512-q/M3lYpY…`), so a changed tarball fails the install.
