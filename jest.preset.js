const { swcAngularJestTransformer } = require('@jscutlery/swc-angular');

const [swcTransformer, swcConfig] = swcAngularJestTransformer({ useDefineForClassFields: false });
// Set jsc.target es5 so SWC emits var-style (not native class) — avoids TDZ errors in circular
// dependency chains that were silently tolerated by TypeScript's CJS emit (direct exports assignment).
const { env: _env, ...swcConfigWithoutEnv } = swcConfig;
const swcConfigEs5 = { ...swcConfigWithoutEnv, jsc: { ...swcConfigWithoutEnv.jsc, target: 'es5' } };

module.exports = {
  testEnvironment: 'jsdom',
  // Load the CommonJS build of packages that also export a browser ESM build.
  testEnvironmentOptions: {
    customExportConditions: ['node', 'require', 'default'],
  },
  testMatch: ['**/?(*.)+(spec|test).?([mc])[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'js', 'mts', 'mjs', 'cts', 'cjs', 'html'],
  resolver: require.resolve('./jest.resolver.js'),
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
  // `.pnpm/` is pnpm's store and `.aspect_rules_js/` Bazel's: the store directory is skipped
  // and the package's own `node_modules/<name>` segment decides.
  transformIgnorePatterns: [
    'node_modules/(?!\\.pnpm/|\\.aspect_rules_js/|.*\\.mjs$|@angular|@dasch-swiss|@ckeditor|lodash-es)',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};
