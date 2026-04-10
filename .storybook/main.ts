import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: [
    '../libs/vre/ui/ui/src/**/*.stories.@(ts|mdx)',
    '../libs/vre/ui/progress-indicator/src/**/*.stories.@(ts|mdx)',
    '../libs/vre/pages/user-settings/user/src/**/*.stories.@(ts|mdx)',
  ],
  addons: [],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
};

export default config;
