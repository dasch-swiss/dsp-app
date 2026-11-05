/* eslint-disable */
module.exports = {
  displayName: 'dsp-js',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  coverageDirectory: '../../coverage/libs/dsp-js',
  transformIgnorePatterns: ['node_modules/(?!\\.pnpm/|@angular|@dasch-swiss|rxjs)'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/**/*.d.ts', '!src/test-setup.ts', '!src/index.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.ts'],
  moduleNameMapper: {
    '^rxjs/ajax$': require.resolve('rxjs/ajax'),
    '^rxjs$': require.resolve('rxjs'),
  },
};
