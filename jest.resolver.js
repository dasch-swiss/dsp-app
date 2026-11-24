// Jest's default resolver, falling back to TypeScript's module resolution against the
// library's tsconfig.spec.json, so the `@dasch-swiss/...` aliases in tsconfig.base.json's
// `paths` resolve to sources.
const path = require('path');

let ts;
let compilerSetup;

function getCompilerSetup(rootDir) {
  const tsConfigPath = ts.findConfigFile(rootDir, ts.sys.fileExists, 'tsconfig.spec.json');
  if (!tsConfigPath) {
    throw new Error(`No tsconfig.spec.json at or above ${rootDir}`);
  }
  const readResult = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  const config = ts.parseJsonConfigFileContent(readResult.config, ts.sys, path.dirname(tsConfigPath));
  return { compilerOptions: config.options, host: ts.createCompilerHost(config.options, true) };
}

module.exports = function (request, options) {
  try {
    return options.defaultResolver(request, options);
  } catch (e) {
    if (request === '@jest/test-sequencer' || request.startsWith('jest-sequencer-')) {
      return undefined;
    }
    ts = ts || require('typescript');
    compilerSetup = compilerSetup || getCompilerSetup(options.rootDir);
    const { compilerOptions, host } = compilerSetup;
    const resolved = ts.resolveModuleName(
      request,
      path.join(options.basedir, 'fake-placeholder.ts'),
      compilerOptions,
      host
    ).resolvedModule?.resolvedFileName;
    if (!resolved) {
      throw e;
    }
    return path.resolve(options.rootDir, resolved);
  }
};
