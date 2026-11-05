/* eslint-disable */
module.exports = {
  displayName: 'dsp-js',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  transformIgnorePatterns: ['node_modules/(?!\\.pnpm/|@angular|@dasch-swiss|rxjs)'],
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.ts'],
  moduleNameMapper: {
    '^rxjs/ajax$': require.resolve('rxjs/ajax'),
    '^rxjs$': require.resolve('rxjs'),
  },
};
