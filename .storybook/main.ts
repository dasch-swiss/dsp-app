import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../libs/**/*.stories.@(ts|mdx)', '../apps/**/*.stories.@(ts|mdx)'],
  addons: [],
  framework: {
    name: getAbsolutePath('@storybook/angular'),
    options: {},
  },
  staticDirs: [
    { from: '../apps/dsp-app/src/assets', to: '/assets' },
    // Media fixtures for the audio/video/image stories, served same-origin so that
    // no story reaches out to iiif.dev, iiif.stage or a public CDN — a remote file
    // that streams keeps the page off `networkidle` and times out pixeleye's
    // capture (DEV-7238). Reuses the fixtures the Cypress suite already commits.
    { from: '../apps/dsp-app/cypress/uploads', to: '/storybook-media' },
  ],
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

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
