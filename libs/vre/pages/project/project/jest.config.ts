/* eslint-disable */
module.exports = {
  displayName: 'vre-pages-project-project',
  preset: '../../../../../jest.preset.js',
  transformIgnorePatterns: [
    // uuid is ESM-only since v12, so SWC must transform it.
    'node_modules/(?!\\.pnpm/|.*\\.mjs$|@angular|@dasch-swiss|@ngx-translate|@ckeditor|ngx-color-picker|lodash-es|uuid)',
  ],
};
