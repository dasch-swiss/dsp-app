const path = require('path');
const fs = require('fs');

const { findNxLibraries } = require('./tools/lib-paths'); // Import the helper function

// Get all `src/lib/` paths inside nested Nx libraries in `libs/vre/`
const libsDir = path.join(__dirname, 'libs/vre');
const libPaths = findNxLibraries(libsDir).filter(libPath => fs.existsSync(libPath));

module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        loader: '@jsdevtools/coverage-istanbul-loader',
        options: { esModules: true },
        enforce: 'post',
        include: [path.join(__dirname, 'apps/dsp-app'), ...libPaths],
        exclude: [/\.(cy|spec)\.ts$/, /node_modules/],
      },
    ],
  },
};
