'use strict';
// Stub returned by jest moduleNameMapper. jsdom checks typeof Canvas.createCanvas === "function"
// before using canvas; returning {} (no createCanvas) makes jsdom set Canvas = null and skip
// all canvas rendering without error.
module.exports = {};
