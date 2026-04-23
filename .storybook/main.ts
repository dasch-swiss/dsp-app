import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../libs/**/*.stories.@(ts|mdx)', '../apps/**/*.stories.@(ts|mdx)'],
  addons: [],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  staticDirs: [{ from: '../apps/dsp-app/src/assets', to: '/assets' }],
};

export default config;
