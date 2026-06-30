'use strict';
// Export null so jsdom (>=26, bundled with jest-environment-jsdom 30) treats the
// `canvas` package as unavailable and falls back to its "not implemented" canvas
// stubs instead of calling Canvas.createCanvas. jsdom only takes that graceful
// path when require('canvas') is falsy; an empty object ({}) is truthy and made
// HTMLCanvasElementImpl._getCanvas throw "Canvas.createCanvas is not a function".
module.exports = null;
