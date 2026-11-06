/* eslint-disable */
module.exports = {
  displayName: 'vre-shared-app-analytics',
  preset: '../../../../jest.preset.js',
  // fix: SyntaxError: Unexpected token 'export' of js-lib
  transformIgnorePatterns: ['node_modules/(?!\\.pnpm/|@angular|@dasch-swiss|@ngx|@sentry)'],
};
