// Usage: write_index.mjs <index.html> <esbuild output dir> <esbuild metafile> <styles.css> <scripts.js>
//   <out dir> <optimize: true|false>
//
// Writes <out dir>/index.html with the stylesheet, the global scripts, the two module entries and
// the CLI's modulepreload hints, and copies the stylesheet and the scripts beside it under
// content-hashed names: nginx caches every .css and .js for a year, so an unhashed name would keep
// serving last release's copy. An optimized index inlines the critical CSS as the CLI does.
import Beasties from 'beasties';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const [inputHtml, bundleDir, metafile, styles, scripts, outDir, optimize] = process.argv.slice(2);

const entry = name => {
  const hits = readdirSync(bundleDir).filter(f => new RegExp(`^${name}-[A-Z0-9]+\\.js$`).test(f));
  if (hits.length !== 1) throw new Error(`expected one ${name} entry in ${bundleDir}, found ${hits}`);
  return hits[0];
};

// The hash the bundle inventory normalizes: eight upper-case characters.
const hashed = file => {
  const content = readFileSync(file);
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 8).toUpperCase();
  const ext = extname(file);
  const name = `${basename(file, ext)}-${hash}${ext}`;
  writeFileSync(join(outDir, name), content);
  return name;
};

// The chunks the entries import statically, nearest first, at most ten: the CLI's rule.
const MODULE_PRELOAD_MAX = 10;
const modulePreloads = entries => {
  const { outputs } = JSON.parse(readFileSync(metafile, 'utf8'));
  const path = name => Object.keys(outputs).find(key => basename(key) === name);
  const depth = new Map(entries.map(name => [path(name), 0]));
  const queue = [...depth.keys()];
  for (let current = queue.shift(); current; current = queue.shift()) {
    for (const { path: imported, kind, external } of outputs[current].imports) {
      if (kind === 'import-statement' && !external && !depth.has(imported)) {
        depth.set(imported, depth.get(current) + 1);
        queue.push(imported);
      }
    }
  }
  return [...depth]
    .filter(([, d]) => d > 0)
    .sort(([, a], [, b]) => a - b)
    .slice(0, MODULE_PRELOAD_MAX)
    .map(([key]) => basename(key));
};

mkdirSync(outDir, { recursive: true });
const [polyfills, main] = [entry('polyfills'), entry('main')];
const head = `<link rel="stylesheet" href="${hashed(styles)}">`;
const body = [
  ...modulePreloads([polyfills, main]).map(chunk => `<link rel="modulepreload" href="${chunk}">`),
  `<script src="${polyfills}" type="module"></script>`,
  `<script src="${hashed(scripts)}" defer></script>`,
  `<script src="${main}" type="module"></script>`,
].join('\n    ');
const html = readFileSync(inputHtml, 'utf8');
if (!html.includes('</head>') || !html.includes('</body>')) {
  throw new Error(`${inputHtml} lacks </head> or </body>`);
}
let index = html.replace('</head>', `  ${head}\n  </head>`).replace('</body>', `  ${body}\n  </body>`);
if (optimize === 'true') {
  // The options the CLI's InlineCriticalCssProcessor passes.
  const beasties = new Beasties({
    path: outDir,
    logLevel: 'warn',
    compress: true,
    pruneSource: false,
    reduceInlineStyles: false,
    mergeStylesheets: false,
    preload: 'media',
    noscriptFallback: true,
    inlineFonts: true,
  });
  index = await beasties.process(index);
}
writeFileSync(join(outDir, 'index.html'), index);
