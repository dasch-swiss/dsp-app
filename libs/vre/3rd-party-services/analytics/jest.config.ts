/* eslint-disable */
export default {
  displayName: 'vre-shared-app-analytics',
  preset: '../../../../jest.preset.js',
  coverageDirectory: '../../../../coverage/libs/vre/3rd-party-services/analytics',
  // fix: SyntaxError: Unexpected token 'export' of js-lib
  transformIgnorePatterns: ['node_modules/(?!@angular|@dasch-swiss|@ngx|@sentry)'],
};
