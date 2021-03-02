# Changelog

## [4.3.0](https://www.github.com/dasch-swiss/dsp-app/compare/v4.2.1...v4.3.0) (2021-03-02)


### Bug Fixes

* **ontology:** set the cache earlier in case of only one ontology (DSP-1374) ([#397](https://www.github.com/dasch-swiss/dsp-app/issues/397)) ([c23ae61](https://www.github.com/dasch-swiss/dsp-app/commit/c23ae6101bb307273cf3a267248eb4ac4976b4c2))


### Enhancements

* **list-editor:** insert a child node at a specific position (DSP-1301) ([#395](https://www.github.com/dasch-swiss/dsp-app/issues/395)) ([5107200](https://www.github.com/dasch-swiss/dsp-app/commit/5107200dc769d5690f5356bb467f05143a05abd1))
* **ontology:** separate list of ontology properties (DSP-1364) ([#391](https://www.github.com/dasch-swiss/dsp-app/issues/391)) ([0f94df6](https://www.github.com/dasch-swiss/dsp-app/commit/0f94df6a32554c58e02ed863458724a6d4e0bb8c))


### Maintenance

* **deps:** bump three from 0.118.3 to 0.125.0 ([#402](https://www.github.com/dasch-swiss/dsp-app/issues/402)) ([5ab9c49](https://www.github.com/dasch-swiss/dsp-app/commit/5ab9c4904c609e77ff208adaced55ddd8f569270))
* **gh-ci:** update release please configuration (DSP-1381) ([#399](https://www.github.com/dasch-swiss/dsp-app/issues/399)) ([040df19](https://www.github.com/dasch-swiss/dsp-app/commit/040df19bad31cc4cbdf13f8253e8bde23bdf144c))
* **project landing page:** use metadata endpoint to get data from backend (DSP-1199) ([#400](https://www.github.com/dasch-swiss/dsp-app/issues/400)) ([5dde42f](https://www.github.com/dasch-swiss/dsp-app/commit/5dde42f2d5a1e2e47d5f60bc734d74200c425dea))
* **tests:** script to find ignored tests ([#396](https://www.github.com/dasch-swiss/dsp-app/issues/396)) ([9ca249d](https://www.github.com/dasch-swiss/dsp-app/commit/9ca249d35de895cd96d9bc08a82f3957f6945e8e))

### [4.2.1](https://www.github.com/dasch-swiss/dsp-app/compare/v4.2.0...v4.2.1) (2021-02-24)


### Bug Fixes

* **ontology:** bug fix in list property (DSP-1368) ([#390](https://www.github.com/dasch-swiss/dsp-app/issues/390)) ([2fb448e](https://www.github.com/dasch-swiss/dsp-app/commit/2fb448e5ae7d0a96d6e1edbd42717ea837371c20))

## [4.2.0](https://www.github.com/dasch-swiss/dsp-app/compare/v4.1.0...v4.2.0) (2021-02-22)


### Enhancements

* **list-editor:** add deletion functionality (DSP-1334) ([#378](https://www.github.com/dasch-swiss/dsp-app/issues/378)) ([34c74a6](https://www.github.com/dasch-swiss/dsp-app/commit/34c74a6474aead06f0ee822488df7d4a702385e8))
* **list-editor:** delete list root node (DSP-1356) ([#386](https://www.github.com/dasch-swiss/dsp-app/issues/386)) ([5d5eabf](https://www.github.com/dasch-swiss/dsp-app/commit/5d5eabf2521bd71a2b3055fc1f8b5b0c6ff043a5))
* **list-editor:** reposition a child node amongst its siblings (DSP-1340) ([#388](https://www.github.com/dasch-swiss/dsp-app/issues/388)) ([0a9be0e](https://www.github.com/dasch-swiss/dsp-app/commit/0a9be0ea8f73dfe72bf34bdc86c941bf7ac93c41))
* **ontology:** default language for property label ([#382](https://www.github.com/dasch-swiss/dsp-app/issues/382)) ([97230d1](https://www.github.com/dasch-swiss/dsp-app/commit/97230d1a3bba0ff27dc33674a47cfba126e19434))
* **ontology:** edit res class info (DSP-1209) ([#380](https://www.github.com/dasch-swiss/dsp-app/issues/380)) ([2debd03](https://www.github.com/dasch-swiss/dsp-app/commit/2debd036db2da4e224625ddb793133fb0fde5668))
* **ontology:** refactor list of properties in resource class (DSP-1360) ([#389](https://www.github.com/dasch-swiss/dsp-app/issues/389)) ([aa565b3](https://www.github.com/dasch-swiss/dsp-app/commit/aa565b3f5265cc0416e05282db400bfe9194836e))

## [4.1.0](https://www.github.com/dasch-swiss/dsp-app/compare/v4.0.0...v4.1.0) (2021-02-12)


### Documentation

* init mkdocs and move documentation from DSP-DOCS into DSP-APP repo (DSP-380) ([#379](https://www.github.com/dasch-swiss/dsp-app/issues/379)) ([07f5067](https://www.github.com/dasch-swiss/dsp-app/commit/07f50678c75d1da4cfc2c4792917b13840b5eaf6))


### Maintenance

* bumps DSP-JS to 1.3.0 and DSP-UI to 1.2.1 ([#374](https://www.github.com/dasch-swiss/dsp-app/issues/374)) ([7b795ee](https://www.github.com/dasch-swiss/dsp-app/commit/7b795ee56026fa3a9e2f44e9c43a4d3502b5d764))
* **deps:** bump socket.io from 2.3.0 to 2.4.1 ([#367](https://www.github.com/dasch-swiss/dsp-app/issues/367)) ([8133d87](https://www.github.com/dasch-swiss/dsp-app/commit/8133d876bb4f606293604a4a63111fddd8993e1a))


### Enhancements

* **list editor:** Adds support for editing lists (DSP-741) ([#365](https://www.github.com/dasch-swiss/dsp-app/issues/365)) ([5b6ee4b](https://www.github.com/dasch-swiss/dsp-app/commit/5b6ee4be19b1b900fcb58a789d1e2cff44cb79e6))
* **ontology:** update cardinality in resource class (DSP-1266) ([#377](https://www.github.com/dasch-swiss/dsp-app/issues/377)) ([5a766c1](https://www.github.com/dasch-swiss/dsp-app/commit/5a766c1db06d862b2edfba49347a659f4233d1c2))

## [4.0.0](https://www.github.com/dasch-swiss/dsp-app/compare/v3.0.0...v4.0.0) (2021-01-28)


### ⚠ BREAKING CHANGES

* set up the login page as a starting page (DSP-1292) (#370)
* **app+main:** comment out the search and everything related to resources (DSP-1291) (#371)

### Bug Fixes

* **dialog:** Diaolog box height issue fixed ([#358](https://www.github.com/dasch-swiss/dsp-app/issues/358)) ([15d1182](https://www.github.com/dasch-swiss/dsp-app/commit/15d11820ef7a3b063f2f706d9bfce7e51c9ea514))
* **routing:** bring back the route handler in main component (DSP-1303) ([#373](https://www.github.com/dasch-swiss/dsp-app/issues/373)) ([8492c1a](https://www.github.com/dasch-swiss/dsp-app/commit/8492c1acd23da73ed143e160388eb0080ff60b17))


### Maintenance

* update pr template (DSP-1189) ([#353](https://www.github.com/dasch-swiss/dsp-app/issues/353)) ([f348e70](https://www.github.com/dasch-swiss/dsp-app/commit/f348e70c4fa4dc0aeb2573aba4e1aa62fc1725a6))
* update the dsp-ui and dsp-js versions to the latest ([#364](https://www.github.com/dasch-swiss/dsp-app/issues/364)) ([66931f0](https://www.github.com/dasch-swiss/dsp-app/commit/66931f088d4a9ad07da219c4a6e8e81d39f4596e))


### Enhancements

* display metadata on project landing page (DSP-1065) ([#348](https://www.github.com/dasch-swiss/dsp-app/issues/348)) ([3012ef5](https://www.github.com/dasch-swiss/dsp-app/commit/3012ef5e767dea3a16c7ae380bf3f1a4b3385c9e))
* **error:** Server error handler (DSP-710) ([#355](https://www.github.com/dasch-swiss/dsp-app/issues/355)) ([d5b77bf](https://www.github.com/dasch-swiss/dsp-app/commit/d5b77bf89470d5bb63b7850ce1b98dbc02d87223))
* **new-resource-form:** make visible the required prop fields (DSP-1115) ([#342](https://www.github.com/dasch-swiss/dsp-app/issues/342)) ([5885b04](https://www.github.com/dasch-swiss/dsp-app/commit/5885b041c2c7c223277a50ccc0495872b1d099fe))
* **project landing page:** add copy to clipboard functionality (DSP-1248) ([#368](https://www.github.com/dasch-swiss/dsp-app/issues/368)) ([17bf71c](https://www.github.com/dasch-swiss/dsp-app/commit/17bf71c4502074264070bd513301139c43976a58))
* **select-resource-class:** allow accented character (DSP-1241) ([#363](https://www.github.com/dasch-swiss/dsp-app/issues/363)) ([8a2654b](https://www.github.com/dasch-swiss/dsp-app/commit/8a2654b75f3194292b2fada9239c29ffa44fe8db))


### refactor

* **app+main:** comment out the search and everything related to resources (DSP-1291) ([#371](https://www.github.com/dasch-swiss/dsp-app/issues/371)) ([50b1309](https://www.github.com/dasch-swiss/dsp-app/commit/50b13091e6437a68ea2a45bb7b50a4e655f5d85d))
* set up the login page as a starting page (DSP-1292) ([#370](https://www.github.com/dasch-swiss/dsp-app/issues/370)) ([46dfdbb](https://www.github.com/dasch-swiss/dsp-app/commit/46dfdbba13adff1dc40eb5bb8422a3093b1e8b74))

## [3.0.0](https://www.github.com/dasch-swiss/dsp-app/compare/v2.0.1...v3.0.0) (2020-12-18)


### ⚠ BREAKING CHANGES

* Prepare next big release (#350)

### Bug Fixes

* **header:** Replace search-panel with fulltext-search ([#313](https://www.github.com/dasch-swiss/dsp-app/issues/313)) ([d234fa7](https://www.github.com/dasch-swiss/dsp-app/commit/d234fa7be480f0769474c39ae39169d2ad3d4c4f))
* **node_modules:** Update dependencies ([#318](https://www.github.com/dasch-swiss/dsp-app/issues/318)) ([f85e4a2](https://www.github.com/dasch-swiss/dsp-app/commit/f85e4a2a0c727c7b44f5659b05d11d139fb26236))
* **project:** Bug fix in project view when not logged-in ([#339](https://www.github.com/dasch-swiss/dsp-app/issues/339)) ([ce5acf1](https://www.github.com/dasch-swiss/dsp-app/commit/ce5acf11b28309674e75fdaf15ead60dbb4bcc96))
* **workspace:** Fix broken link ([#306](https://www.github.com/dasch-swiss/dsp-app/issues/306)) ([52b324d](https://www.github.com/dasch-swiss/dsp-app/commit/52b324db05a6fb62675e43733b1f5bc19f99f29f))
* Open external link in new tab ([#297](https://www.github.com/dasch-swiss/dsp-app/issues/297)) ([99f188e](https://www.github.com/dasch-swiss/dsp-app/commit/99f188ece067d509e6f177e259bbb97b2d49983a))
* Replaced reset buttons with cancel button ([#284](https://www.github.com/dasch-swiss/dsp-app/issues/284)) ([1481018](https://www.github.com/dasch-swiss/dsp-app/commit/14810180c63cf3a44f1f3950105ffb87db335c02))
* Update docker environment ([#294](https://www.github.com/dasch-swiss/dsp-app/issues/294)) ([db6d277](https://www.github.com/dasch-swiss/dsp-app/commit/db6d277cdf5bbb5372a63e64eeb7b53684338eff))


### Documentation

* Update README ([#292](https://www.github.com/dasch-swiss/dsp-app/issues/292)) ([fa72ee1](https://www.github.com/dasch-swiss/dsp-app/commit/fa72ee1efc3da54c7f04f23ddd6c7513a607cc53))


### Enhancements

* Prepare next big release ([#350](https://www.github.com/dasch-swiss/dsp-app/issues/350)) ([6a39180](https://www.github.com/dasch-swiss/dsp-app/commit/6a391800c09684ae79b9a88dc31a6f1f75c54716))
* **header:** display form link when the session is active ([#332](https://www.github.com/dasch-swiss/dsp-app/issues/332)) ([d609bd5](https://www.github.com/dasch-swiss/dsp-app/commit/d609bd506e08fe86a84af74b6c7fcaf7362fde84))
* **header+dialog:** create button in the header + dialog box ([#320](https://www.github.com/dasch-swiss/dsp-app/issues/320)) ([5e4890d](https://www.github.com/dasch-swiss/dsp-app/commit/5e4890d55f1b2e8d9cff030ea2481344ac004e6f))
* **PR:** Add template for PRs ([#305](https://www.github.com/dasch-swiss/dsp-app/issues/305)) ([1468ee1](https://www.github.com/dasch-swiss/dsp-app/commit/1468ee1daec724ece8c84e96b3a53854577a16d9))


### Maintenance

* **ci:** Update package-name in gh actions workflow ([#352](https://www.github.com/dasch-swiss/dsp-app/issues/352)) ([3d9bb13](https://www.github.com/dasch-swiss/dsp-app/commit/3d9bb13b6a0fd8ab9a57d1e11e6ce77be7ae2433))
* Update js- and ui-lib version ([#293](https://www.github.com/dasch-swiss/dsp-app/issues/293)) ([5409d9b](https://www.github.com/dasch-swiss/dsp-app/commit/5409d9bdb2f72b2f269ba0a7ba039d3cbcae472b))
