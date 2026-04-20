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
  moduleNameMapper: {
    // canvas is an optional peer dep of jest-environment-jsdom installed without its native binary
    // (npm ci --ignore-scripts). jsdom detects it via require.resolve() then loads it unconditionally,
    // causing "Cannot find module '../build/Release/canvas.node'". Returning an object without
    // createCanvas() makes jsdom set Canvas = null and skip all canvas rendering silently.
    '^canvas$': `${__dirname}/__mocks__/canvas.js`,
    ...(nxPreset.moduleNameMapper || {}),
  },
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
