import baseConfig from '../../eslint.config.mjs';
import typescriptEslintParser from '@typescript-eslint/parser';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/extensions': 'off',
      'no-use-before-define': 'off',
    },
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        project: ['libs/dsp-js/tsconfig.lib.json', 'libs/dsp-js/tsconfig.spec.json'],
        createDefaultProgram: true,
      },
    },
  },
  {
    files: ['**/*.spec.ts', 'test/**/*.ts', 'src/test-setup.ts'],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        project: ['libs/dsp-js/tsconfig.spec.json'],
        createDefaultProgram: true,
      },
    },
  },
];
