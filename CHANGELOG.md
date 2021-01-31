# Changelog

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
