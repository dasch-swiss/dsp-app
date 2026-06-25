import nx from '@nx/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginBan from 'eslint-plugin-ban';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import storybook from 'eslint-plugin-storybook';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';

export default [
  {
    // ESLint 9 reports unused disable directives by default; ESLint 8 (eslintrc) did not. Keep the
    // pre-migration behavior so the flat-config switch doesn't surface pre-existing stale directives.
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  ...storybook.configs['flat/recommended'],
  {
    plugins: {
      ban: eslintPluginBan,
      'unused-imports': eslintPluginUnusedImports,
      import: eslintPluginImport,
      prettier: eslintPluginPrettier,
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'prettier/prettier': 'error',
      // rules that need to be off for other configuration to work
      'arrow-body-style': 'off',
      'arrow-parens': 'off',
      'implicit-arrow-linebreak': 'off',
      'operator-linebreak': 'off',
      'object-curly-newline': 'off',
      'function-paren-newline': 'off',
      'max-len': 'off',
      '@typescript-eslint/comma-dangle': 'off',
      '@typescript-eslint/indent': 'off',
      '@typescript-eslint/lines-between-class-members': 'off',
      // rules to work on later on
      'class-methods-use-this': 'off',
      'default-case': 'off',
      eqeqeq: 'off',
      'consistent-return': 'off',
      'grouped-accessor-pairs': 'off',
      'import/prefer-default-export': 'off',
      'import/no-cycle': 'off',
      'import/order': [
        'error',
        {
          alphabetize: {
            order: 'asc',
          },
        },
      ],
      'max-classes-per-file': 'off',
      'no-case-declarations': 'off',
      'no-console': 'off',
      'no-else-return': 'off',
      'no-nested-ternary': 'off',
      'no-param-reassign': 'off',
      'no-plusplus': 'off',
      'no-prototype-builtins': 'off',
      'no-redeclare': 'off',
      'no-restricted-syntax': 'off',
      'no-undef': 'off',
      'no-underscore-dangle': 'off',
      'no-unsafe-optional-chaining': 'off',
      'no-unused-vars': 'off',
      'no-useless-escape': 'off',
      'prefer-regex-literals': 'off',
      'prefer-destructuring': 'off',
      radix: 'off',
      'unused-imports/no-unused-vars': [
        'off',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      // rules newly surfaced by ts-eslint 8 / flat presets, disabled to preserve pre-migration behavior
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    // environment files import build-time resources via absolute paths (intentional)
    files: ['**/environment*.ts'],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
      'import/order': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.spec.js', '**/*.spec.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
      'import/order': [
        'error',
        {
          alphabetize: {
            order: 'asc',
          },
        },
      ],
      'ban/ban': [
        2,
        {
          name: ['describe', 'only'],
          message: "don't focus tests",
        },
        {
          name: 'fdescribe',
          message: "don't focus tests",
        },
        {
          name: ['it', 'only'],
          message: "don't focus tests",
        },
        {
          name: 'fit',
          message: "don't focus tests",
        },
        {
          name: ['test', 'only'],
          message: "don't focus tests",
        },
        {
          name: 'ftest',
          message: "don't focus tests",
        },
      ],
    },
  },
  eslintConfigPrettier,
  {
    ignores: [
      '.github/',
      '.idea/',
      '.vscode/',
      'node_modules/',
      'dist/',
      'tmp/',
      'docs/assets/js/',
      'apps/dsp-app/cypress/',
    ],
  },
];
