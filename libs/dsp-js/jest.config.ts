/* eslint-disable */
export default {
  displayName: 'dsp-js',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  coverageDirectory: '../../coverage/libs/dsp-js',
  transformIgnorePatterns: ['node_modules/(?!@angular|@dasch-swiss|rxjs)'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/**/*.d.ts', '!src/test-setup.ts', '!src/index.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.ts'],
  moduleNameMapper: {
    '^rxjs/ajax$': '<rootDir>/../../node_modules/rxjs/dist/cjs/ajax/index.js',
    '^rxjs$': '<rootDir>/../../node_modules/rxjs/dist/cjs/index.js'
  }
};
