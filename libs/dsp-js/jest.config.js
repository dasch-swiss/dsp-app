/* eslint-disable */
module.exports = {
  displayName: 'dsp-js',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  rootDir: __dirname,
  roots: ['<rootDir>/src'],
  transformIgnorePatterns: ['node_modules/(?!\\.pnpm/|\\.aspect_rules_js/|@angular|@dasch-swiss|rxjs)'],
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.ts'],
  moduleNameMapper: {
    '^rxjs/ajax$': require.resolve('rxjs/ajax'),
    '^rxjs$': require.resolve('rxjs'),
  },
};
