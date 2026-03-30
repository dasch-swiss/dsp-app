import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(ts|mdx)',
    '../../progress-indicator/src/**/*.stories.@(ts|mdx)',
  ],
  addons: [],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
};

export default config;
