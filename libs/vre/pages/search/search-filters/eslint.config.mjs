import angularConfig from '../../../../../eslint.config.angular.mjs';

export default [
  ...angularConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/prefer-standalone': 'off',
    },
  },
];
