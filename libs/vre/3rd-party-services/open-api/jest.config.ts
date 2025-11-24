/* eslint-disable */
export default {
  displayName: 'vre-open-api',
  preset: '../../../../jest.preset.js',
  coverageDirectory: '../../../../coverage/libs/vre/3rd-party-services/open-api',
  transformIgnorePatterns: ['node_modules/(?!@angular|@dasch-swiss|@ngx|@sentry)'],
  collectCoverageFrom: [
    'src/lib/type-guards.ts', // Only include hand-written code
    '!src/generated/**', // Exclude all auto-generated code
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
};
