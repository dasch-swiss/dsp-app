const nxPreset = require('@nx/jest/preset').default;
const { swcAngularJestTransformer } = require('@jscutlery/swc-angular');

const [swcTransformer, swcConfig] = swcAngularJestTransformer({ useDefineForClassFields: false });
// Set jsc.target es5 so SWC emits var-style (not native class) — avoids TDZ errors in circular
// dependency chains that were silently tolerated by TypeScript's CJS emit (direct exports assignment).
const { env: _env, ...swcConfigWithoutEnv } = swcConfig;
const swcConfigEs5 = { ...swcConfigWithoutEnv, jsc: { ...swcConfigWithoutEnv.jsc, target: 'es5' } };

module.exports = {
  ...nxPreset,
  coverageReporters: ['html', 'json', 'text-summary', 'lcov'],
  coverageProvider: 'v8',
  setupFiles: ['reflect-metadata'],
  transform: {
    '^.+\\.(ts|mjs|js)$': [swcTransformer, swcConfigEs5],
    '^.+\\.(html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|@angular|@dasch-swiss|@ckeditor|lodash-es)',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};
