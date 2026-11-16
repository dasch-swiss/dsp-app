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
    // Project-local ignores, resolved relative to this config's directory, where the base
    // config's workspace-root-relative `apps/dsp-app/cypress/` ignore does not match;
    // re-ignore cypress here so E2E specs stay excluded (see DEV-6686).
    ignores: ['coverage/', 'cypress/'],
  },
];
