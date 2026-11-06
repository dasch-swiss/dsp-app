# Build Baselines

The numbers the build-system migration (DEV-7767) is compared against. A later run that differs
from them is a defect to explain, not a new baseline.

## How the numbers are produced

| Number | Command |
| ------ | ------- |
| Passing spec files, passing and skipped tests per library | `scripts/test-counts.sh` |
| The same, for the Bazel test targets, after `just test` | `scripts/test-counts-bazel.sh` |
| Bundle inventory | `just build`, then `scripts/bundle-inventory.sh bazel-bin/apps/dsp-app/dist` (before the migration: `pnpm exec nx build dsp-app` over `dist/apps/dsp-app`) |
| Hash of a generated tree | `scripts/tree-hash.sh <dir>` |
| Stories | `just storybook-build`, then the `type: story` entries of `bazel-bin/storybook/index.json` (before: `pnpm run build-storybook` over `dist/storybook`) |
| Storybook interaction tests | `just storybook-test` (before: `pnpm run test-storybook` against that build) |
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

Measured at commit `535bd182b` (Phase 3), darwin-arm64, Node 24.20.0 (the dev shell's `nodejs_24`), pnpm
10.33.2, 2026-11-05.

### Test counts after the switch

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

### Bundle inventory after the switch

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
  (chromium v1228), the `playwright-driver` version of the locked nixpkgs.

CI run 42118134666 (Node 24.22.1) captured 811 stories and 24 breakpoint stories with that
split, the CLI downloading its own 1.59.0 browsers. Phase 9 therefore gives the Pixeleye job a
writable `PLAYWRIGHT_BROWSERS_PATH`, not the read-only Nix store path: the CLI's own 1.59.0
download, plus chromium-headless-shell for 1.61.1 from `playwright-core install`. The Nix
browsers cannot be linked in: on start the CLI deletes every browser in the directory that no
installed Playwright registered (CI run 42261938720).

## End of the migration: the spike's measurements repeated

The branch at Phase 10 (`afd0c1ed1`, the last source state; later commits change docs only), Node
24.22.1, 2026-11-06, with the spike's methods so the numbers compare with the spike report
(`dasch-specs`, `02-dsp-app-bazel-spike-report.md`, Node 22.23.4). GitHub-hosted numbers come
from a temporary workflow, CI runs 42275203816 and 42276450027; the darwin numbers from an
Apple-silicon Mac (10 cores, 64 GB) with no Docker container running.

### Build times on a GitHub-hosted runner

4 vCPU, 16 GB, no remote cache and no disk cache, `--lockfile_mode=error` on a clean clone, wall
clock around `nix develop --command bazel` with the dev shell already built. Six samples, three per
run.

| Measure | Now | Spike | Exit criterion |
| ------- | --- | ----- | -------------- |
| Cold build, `//apps/dsp-app:dist` | 147, 150, 155, 158, 164, 171 s | 157-208 s | fits 45 min: yes |
| Warm no-op, server running | 9.1-11.7 s | not separately measured | |
| Warm no-op after `bazel shutdown` | 14.3, 15.2, 19.1, 19.1, 19.2, 19.3 s | 8.9-9.5 s | under 15 s: **missed in 5 of 6** |
| One-line edit in `libs/vre/ui/ui` to a rebuilt bundle | 25.0, 29.1, 29.8 s (3 samples) | 25.9-26.4 s | under 2 min: yes |
| Peak memory, whole machine, sampled every 2 s | 8.3-9.1 GB used | 6.5-6.9 GB | |
| Sum of the 29 compile actions | 89.5-127.1 s | 129 s | |
| esbuild, production | 16.8-19.7 s | 19.9 s | |

The warm no-op after a restart is 5-10 s slower than the spike's and over its criterion in five
of six samples; peak memory is about 2 GB higher. Neither cause is isolated; the runs use Node 24,
not 22, and the graph has grown since the spike. With the server running the no-op stays under
12 s.

### Remote execution

Run 42276450027, `just build`'s target with the CI remote flags, an empty disk cache and
`--noremote_accept_cached`, so every action executes rather than replays:

- 167.2 s wall clock. 2539 actions: 1625 spawned, **all 1625 ran remotely** (64 percent of all
  actions; the other 914 are Bazel-internal and run nowhere). Among them 32 `TsProject` (the 29
  compiles and 3 more), 2 `esbuild`, 57 `SassCompiler`, 387
  `NpmPackageExtract`, 1106 `CopyFile`, the OpenAPI generator and the JDK actions.
- The same build again with a fresh output base and no disk cache, accepting the remote cache:
  20.7 s, 1625 remote cache hits.

**NativeLink flakiness recurred.** The first attempt, run 42275203816, failed: rules_angular's
worker library (`@@rules_angular+//src/worker:worker_lib_with_user_compiler`), forced to run
remotely, failed with TS2307 on `../with_user_compiler/*.mjs`, the error Phase 7 saw once, and
writing the BEP ended in `RemoteExecutionCapabilitiesException ... Connection timed out`. The
identical rerun passed.

### The esbuild action, darwin

`development`, a one-line inline-template edit in `resource-rights-statement.component.ts`,
3 repetitions each; the esbuild action's duration from the profile.

| Variant | Sandboxed | `--spawn_strategy=local` |
| ------- | --------- | ------------------------ |
| As built | 25.9, 26.1, 26.2 s | 24.0, 24.2, 24.2 s |
| Linker plugin removed | 25.5, 25.7, 25.7 s | 20.8, 20.8, 21.3 s |

- **Sandbox:** about 2 s (spike: 3.3-4.9 s).
- **Linker:** about 3 s without the sandbox; within the noise with it (spike: about 1.5 s).
- **What remains, neither sandbox nor linker:** 20.8-21.3 s (spike: 10.6 s). The action is about
  10 s slower than the spike measured on the same machine, with the Docker stack down. Not
  isolated; Node 24 and the Phase 2 and 7 changes to the inputs are the candidates.

### Edit to updated page, darwin

`development` configuration, 3 repetitions each, with the spike's three edits: the inline
template of `resource-rights-statement.component.ts`, a rule added to `ck-editor.component.scss`,
and a new `@Input` with a fresh default on `NoResultsFoundComponent`.

| | Rebuild alone (`bazel build`) | Save to new content on disk under `ibazel` | Spike, `ibazel` plus reload |
| --- | --- | --- | --- |
| Template edit | 27.2, 27.2, 28.1 s | 30.5, 28.4, 27.3 s | 30.1-44.5 s |
| Stylesheet edit | 28.6, 27.8, 27.6 s | 28.6, 27.6, 27.5 s | 31.5-35.2 s |
| Public signature change | 45.0, 44.1, 46.1 s, 16 compile actions re-ran | 45.9, 44.1, 43.1 s | 35.5-40.2 s |

The `ibazel` column stops when the new content is in `bazel-bin/apps/dsp-app/dist`, which
`just serve` serves; the browser reload the spike's column includes (about 1.5 s) is not in it, and
no browser was driven. No `ng serve` exists any more to compare with; the spike measured it at
about 2.8 s with a reload and under 1 s with HMR. The signature change is 3-10 s slower than the
spike's; the esbuild action alone is about 10 s slower on the template edit.

### Initial bundle against the Phase 3 baseline

`just build` (production) on darwin, `scripts/bundle-inventory.sh`:

| File | Phase 3, Angular CLI | Bazel | Delta |
| ---- | -------------------- | ----- | ----- |
| `main` | 905191 | 896479 | -1.0% |
| `polyfills` | 35897 | 35891 | 0.0% |
| `styles` | 114015 | 113321 | -0.6% |
| `scripts` | 349228 | 352735 | +1.0% |

Every initial file is within 10 percent. 20 chunks: 8 preloaded by `index.html` and 12 lazy, the
same 12 real lazy chunks as the CLI's 16, of which 4 were empty Node stubs.

### CI wall clock

Run 42276499432, a push changing no source since `afd0c1ed1`, with the remote cache, against the
`main` baseline in the plan's Success Metrics (run 41743063312):

| | Now | `main` baseline |
| --- | --- | --- |
| Whole run | 14.3 min | 14.5 min |
| Unit tests | 3.3 min | 8.6 min |
| Linting | 2.6 min | 2.0 min |
| Storybook interaction tests | 6.8 min | 7.0 min |
| E2E heavy | 9.6 min | 8.3 min |
| Pixeleye | 13.6 min | 14.0 min |

Pixeleye still sets the wall clock. Lint and E2E heavy are slower than on `main`.

### Not measured

- The browser reload and an open tab's update: no browser was driven this time.
- Peak memory on darwin: the spike's 8.2 GB was summed RSS, not repeated.
- A source-changing CI run's `bep-test` and `exec.json`: no commit after `1993363c7` changes a source;
  the remote-execution run above is the evidence that `TsProject` and esbuild execute remotely.

## Generated `paths`: direct-only

A library's generated tsconfig maps only the aliases of its declared `deps` to their compiled
`.d.ts`. An import of a library that is not a declared dependency fails with TS2307, so no
separate undeclared-import check exists.

The choice rests on one comparison, run on a throwaway build of the spike's last commit
(`0587a5737`), with every library's `paths` generated once as the transitive closure and once as
the direct `deps` only. The three `resource-editor` components the spike reported as changed
(`geolocation-value`, `authorship-form-field`, `create-resource-form-legal`) were compared by the
`dependencies` array of their `ɵɵdefineComponent`, the template's directive imports:

| Compile | Result for the 3 components |
| ------- | --------------------------- |
| Closure against direct-only, persistent worker | byte-identical `.js` |
| Closure against direct-only, clean output base, no worker | byte-identical `.js` |
| Bazel against the Angular CLI's program (`ngc -p apps/dsp-app/tsconfig.app.json`, same sources and compiler) | same directives in the same order; `MatFormField`, `MatLabel`, `MatHint` and `MatError` come from `@angular/material/form-field` in Bazel and from `@angular/material/input` in the CLI's |

The CLI difference is the module specifier of the same class: `@angular/material/input`
re-exports those four directives from the form-field chunk, and each component imports both
`MatFormFieldModule` and `MatInputModule`, so either specifier names the one class. The spike's
reported difference is the same kind: `MatOption`, re-exported by both `@angular/material/select`
and `@angular/material/autocomplete`, named through one or the other. Which specifier the
compiler writes depends on which declaration files the program loaded, not on the shape of
`paths`, and it does not change what runs. The spike's difference did not reproduce under either
build of the same commit; the build it came from was not kept.

Jest does not read the generated `paths`: `jest.resolver.js` falls back to TypeScript's
resolution against `tsconfig.base.json`, which lists every alias. A library's test therefore
holds to its declared `deps` only through its runfiles, which carry the `sources` of those deps
and nothing else. Seeded check on `core/session`, whose `error-handler` dependency no other dep
of it carries: with `//libs/vre/core/error-handler` removed from `deps`,
`bazel test //libs/vre/core/session:test` fails three of five suites with `Cannot find module
'@dasch-swiss/vre/core/error-handler'` in the local darwin sandbox. The resolver follows the
runfiles symlinks into the execroot's output tree, where a missing dependency's sources are
absent as long as nothing copies them there; remote execution, whose inputs are the declared
ones only, holds without that condition.

## Vendored packages

`vendor/ckeditor5-custom-build-2.1.5.tgz` is `npm pack --ignore-scripts` of the `v2.1.5` tag
(`b107287f9`) of dasch-swiss/ckeditor_custom_build: 1876083 bytes, sha256
`5f5df5b4d3d02182a58ba864287973b23f550adf3f4e2b12b9231950c80c3020`. `pnpm-lock.yaml` records its
integrity (`sha512-q/M3lYpY…`), so a changed tarball fails the install.
