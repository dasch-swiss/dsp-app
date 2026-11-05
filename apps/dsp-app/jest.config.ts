/* eslint-disable */
module.exports = {
  displayName: 'dsp-app',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  transformIgnorePatterns: ['node_modules/(?!\\.pnpm/|@angular|@dasch-swiss|@sentry|@ngx-translate|@ckeditor)'],
};
