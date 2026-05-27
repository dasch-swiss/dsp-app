import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../libs/**/*.stories.@(ts|mdx)', '../apps/**/*.stories.@(ts|mdx)'],
  addons: [],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  staticDirs: [{ from: '../apps/dsp-app/src/assets', to: '/assets' }],
  // The Angular webpack pipeline and Storybook's webpack5 builder both emit *.map
  // assets for the preview bundles, producing "Multiple assets emit different content
  // to the same filename <chunk>.iframe.bundle.js.map" conflicts that break the build.
  // Source maps are not needed for the interaction-test build, so disable devtool and
  // strip any SourceMapDevToolPlugin to make map emission deterministically off.
  webpackFinal: async webpackConfig => {
    webpackConfig.devtool = false;
    webpackConfig.plugins = (webpackConfig.plugins ?? []).filter(
      plugin => !/SourceMapDevToolPlugin/.test(plugin?.constructor?.name ?? '')
    );
    return webpackConfig;
  },
};

export default config;
