import angularConfig from '../../../../eslint.config.angular.mjs';

export default [
  ...angularConfig,
  {
    ignores: ['**/src/generated/**'],
  },
];
