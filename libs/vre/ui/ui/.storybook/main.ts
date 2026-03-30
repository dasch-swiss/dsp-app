import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(ts|mdx)',
    '../../../progress-indicator/src/**/*.stories.@(ts|mdx)',
  ],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  docs: { autodocs: false },
};

export default config;
