/* eslint-disable */
module.exports = {
  displayName: 'vre-pages-search-advanced-search',
  preset: '../../../../../jest.preset.js',
  transformIgnorePatterns: [
    // uuid is ESM-only since v12 — let SWC transform it instead of ignoring it.
    'node_modules/(?!\\.pnpm/|.*\\.mjs$|@angular|@dasch-swiss|@ngx-translate|@ckeditor|ngx-color-picker|lodash-es|uuid)',
  ],
};
