/* eslint-disable */
export default {
  displayName: 'vre-core-session',
  preset: '../../../../jest.preset.js',
  coverageDirectory: '../../../../coverage/libs/vre/core/session',
  transformIgnorePatterns: ['node_modules/(?!@angular|@dasch-swiss|@sentry|@ngx-translate)'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/**/*.d.ts', '!src/test-setup.ts', '!src/index.ts'],
};
