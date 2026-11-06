// What the Angular CLI's application builder sets and raw esbuild does not. An application's
// generated config (vre_application in defs.bzl) default-exports `angularEsbuildConfig(...)`.
import { readFile } from 'node:fs/promises';
import { transformAsync } from '@babel/core';
import { needsLinking } from '@angular/compiler-cli/linker';
import linkerPlugin from '@angular/compiler-cli/linker/babel';

// Material, the CDK, ngrx, ngx-translate and the other Angular packages ship partially compiled;
// an AOT bundle cannot load them until the linker finishes the compilation.
const angularLinker = {
  name: 'angular-linker',
  setup(build) {
    build.onLoad({ filter: /node_modules.*\.m?js$/ }, async args => {
      const source = await readFile(args.path, 'utf8');
      if (!needsLinking(args.path, source)) {
        return null;
      }
      const result = await transformAsync(source, {
        filename: args.path,
        compact: false,
        sourceMaps: 'inline',
        configFile: false,
        babelrc: false,
        plugins: [linkerPlugin],
      });
      return { contents: result.code, loader: 'js' };
    });
  },
};

// Angular's emulated encapsulation writes `%COMP%` into selectors, which no CSS parser accepts.
const COMP = /%COMP%/g;
const COMP_STANDIN = 'NGCOMPSTANDIN';

// A compiled component carries its stylesheets as the `styles` strings of its definition. The CLI
// minifies them before compiling; an optimized bundle minifies them here, before esbuild bundles
// the file, so the libraries compile once for every configuration.
const minifyComponentStyles = {
  name: 'minify-component-styles',
  setup(build) {
    const minify = css =>
      build.esbuild
        .transformSync(css.replace(COMP, COMP_STANDIN), { loader: 'css', minify: true })
        .code.trimEnd()
        .replaceAll(COMP_STANDIN, '%COMP%');
    const minifyStyles = {
      visitor: {
        CallExpression({ node }) {
          if (node.callee.type !== 'MemberExpression' || node.callee.property.name !== 'ɵɵdefineComponent') {
            return;
          }
          const styles = node.arguments[0]?.properties?.find(p => p.key?.name === 'styles');
          for (const element of styles?.value.elements ?? []) {
            if (element.type === 'StringLiteral') {
              element.value = minify(element.value);
              element.extra = undefined;
            }
          }
        },
      },
    };
    build.onLoad({ filter: /\.js$/ }, async args => {
      if (args.path.includes('/node_modules/')) {
        return null;
      }
      const source = await readFile(args.path, 'utf8');
      if (!source.includes('ɵɵdefineComponent')) {
        return null;
      }
      // Babel reads the file's own source map and composes it, so the hidden maps stay exact.
      const result = await transformAsync(source, {
        filename: args.path,
        compact: false,
        sourceMaps: 'inline',
        configFile: false,
        babelrc: false,
        plugins: [minifyStyles],
      });
      return { contents: result.code, loader: 'js' };
    });
  },
};

/**
 * @param {object} options
 * @param {Record<string, string>} options.alias each library's import alias to its compiled
 *   entry point, relative to the Bazel bin directory esbuild runs in
 * @param {boolean} options.optimize minify, component styles included, and strip Angular's
 *   dev-mode checks, as the CLI's `production` configuration does
 * @param {boolean} options.development resolve packages without the `production` export condition
 */
export function angularEsbuildConfig({ alias, optimize, development }) {
  return {
    alias,
    entryNames: '[name]-[hash]',
    chunkNames: 'chunk-[hash]',
    assetNames: 'media/[name]-[hash]',
    // zone.js cannot intercept native async/await; esbuild lowers it to generators.
    supported: { 'async-await': false },
    define: {
      ngJitMode: 'false',
      ngServerMode: 'false',
      ngI18nClosureMode: 'false',
      ngHmrMode: 'false',
      'process.env.NODE_ENV': optimize ? '"production"' : '"development"',
      ...(optimize ? { ngDevMode: 'false' } : {}),
    },
    conditions: ['es2020', 'es2015', 'angular:linked-21', 'module', ...(development ? [] : ['production'])],
    mainFields: ['es2020', 'es2015', 'browser', 'module', 'main'],
    resolveExtensions: ['.js', '.mjs', '.json'],
    loader: { '.json': 'json' },
    minify: optimize,
    legalComments: 'none',
    plugins: optimize ? [angularLinker, minifyComponentStyles] : [angularLinker],
  };
}
