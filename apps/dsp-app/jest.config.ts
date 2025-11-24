/* eslint-disable */
export default {
  displayName: 'dsp-app',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/apps/dsp-app',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  transformIgnorePatterns: ['node_modules/(?!@angular|@dasch-swiss|@sentry|@ngx-translate|@ckeditor)'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
    '!src/test-setup.ts',
    '!src/test.config.ts',
    '!src/polyfills.ts',
    '!src/main.ts',
    '!src/environments/**',
  ],
};