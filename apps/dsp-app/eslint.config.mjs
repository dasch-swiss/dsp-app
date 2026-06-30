import angularConfig from '../../eslint.config.angular.mjs';

export default [
  ...angularConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/prefer-standalone': 'off',
    },
  },
  {
    // Project-local ignores, resolved relative to this config's project root. The inferred
    // `lint` target (@nx/eslint/plugin) runs `eslint .` with cwd = apps/dsp-app, so the
    // workspace-root-relative `apps/dsp-app/cypress/` ignore in the base config no longer
    // matches — re-ignore cypress here so E2E specs stay excluded as before (see DEV-6686).
    ignores: ['coverage/', 'cypress/'],
  },
];
