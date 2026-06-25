/* eslint-disable */
module.exports = {
  displayName: 'vre-pages-search-advanced-search',
  preset: '../../../../../jest.preset.js',
  coverageDirectory: '../../../../../coverage/libs/vre/pages/search/advanced-search',
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|@angular|@dasch-swiss|@ngx-translate|@ckeditor|ngx-color-picker|lodash-es)',
  ],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/**/*.d.ts', '!src/test-setup.ts', '!src/index.ts'],
};
