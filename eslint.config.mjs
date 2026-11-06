import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginBan from 'eslint-plugin-ban';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import storybook from 'eslint-plugin-storybook';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const tsFiles = ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'];
const jsFiles = ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'];

// ADR-0002: a library's barrel is its whole public interface, so an import reaches another library
// only through its `@dasch-swiss/*` alias. Every library's sources sit under its `src/`, so a
// relative import that climbs into a `src`, `libs` or `apps` directory crosses a library root.
// Flat config replaces a rule's options per block, so every block setting the rule repeats these.
const libraryBoundaryPatterns = [
  {
    regex: '^@dasch-swiss/.+/src(/|$)',
    message: "Import the library's barrel through its @dasch-swiss alias, not a file under src/ (ADR-0002).",
  },
  {
    regex: '^\\.\\./(.*/)?(src|libs|apps)(/|$)',
    message: "A relative import must not cross a library root; use the library's @dasch-swiss alias (ADR-0002).",
  },
];

// Deviations from typescript-eslint's recommended set that every file has carried since the
// typescript-eslint v6 migration; the blocks below override several of them for `.ts` files.
const sharedRules = {
  '@typescript-eslint/explicit-member-accessibility': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/no-parameter-properties': 'off',
  '@typescript-eslint/no-non-null-assertion': 'warn',
  '@typescript-eslint/adjacent-overload-signatures': 'error',
  '@typescript-eslint/prefer-namespace-keyword': 'error',
  'no-empty-function': 'off',
  '@typescript-eslint/no-empty-function': 'error',
  '@typescript-eslint/no-inferrable-types': 'error',
  '@typescript-eslint/no-unused-vars': 'warn',
  '@typescript-eslint/no-empty-interface': 'error',
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-require-imports': 'off',
};

export default [
  {
    // ESLint 9 reports unused disable directives by default; ESLint 8 (eslintrc) did not. Keep the
    // pre-migration behavior so the flat-config switch doesn't surface pre-existing stale directives.
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  ...tseslint.config(
    {
      files: tsFiles,
      extends: [js.configs.recommended, ...tseslint.configs.recommended],
      languageOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2020,
        sourceType: 'module',
        parserOptions: { tsconfigRootDir: import.meta.dirname },
      },
      rules: sharedRules,
    },
    {
      files: jsFiles,
      extends: [js.configs.recommended, ...tseslint.configs.recommended],
      languageOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2020,
        sourceType: 'module',
        globals: { ...globals.browser, ...globals.node },
      },
      rules: { ...sharedRules, '@typescript-eslint/no-var-requires': 'off' },
    }
  ),
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
    // Type-aware linting is intentionally not configured: no active rule needs type
    // information. Add languageOptions.parserOptions.project here if a type-checked
    // rule (e.g. @typescript-eslint/only-throw-error) is ever enabled.
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
        'error',
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
    },
  },
  {
    // environment files import build-time resources via absolute paths (intentional)
    files: ['**/environment*.ts'],
    rules: {
      'import/order': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.spec.js', '**/*.spec.jsx'],
    rules: {
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
  {
    files: ['**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: libraryBoundaryPatterns }],
    },
  },
  {
    // CalendarDateService is the one home of the calendar rules applied to a KnoraDate (ARCH-MAP.md,
    // vre/ui/ui). Elsewhere, the calendar library offers only its vocabulary; a component importing
    // its arithmetic directly becomes a second owner of the era and astronomical-year mapping.
    files: ['**/*.ts'],
    ignores: ['**/shared/calendar/**', '**/calendar-date/calendar-date.service.ts', '**/*.spec.ts', '**/*.stories.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@dasch-swiss/vre/shared/calendar',
              allowImportNames: ['CALENDAR_SYSTEMS', 'CalendarSystem'],
              message: 'Calendar rules on a KnoraDate belong in CalendarDateService (@dasch-swiss/vre/ui/ui).',
            },
          ],
          patterns: libraryBoundaryPatterns,
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
