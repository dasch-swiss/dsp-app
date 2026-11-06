// Usage: write_index.mjs <index.html> <esbuild output dir> <styles.css> <scripts.js> <out dir>
//
// Writes <out dir>/index.html with the stylesheet, the global scripts and the two module entries,
// and copies the stylesheet and the scripts beside it under content-hashed names: nginx caches
// every .css and .js for a year, so an unhashed name would keep serving last release's copy.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const [inputHtml, bundleDir, styles, scripts, outDir] = process.argv.slice(2);

const entry = name => {
  const hit = readdirSync(bundleDir).find(f => f.startsWith(`${name}-`) && f.endsWith('.js'));
  if (!hit) throw new Error(`no ${name} entry in ${bundleDir}`);
  return hit;
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

mkdirSync(outDir, { recursive: true });
const head = `<link rel="stylesheet" href="${hashed(styles)}">`;
const body = [
  `<script src="${hashed(scripts)}" defer></script>`,
  `<script type="module" src="${entry('polyfills')}"></script>`,
  `<script type="module" src="${entry('main')}"></script>`,
].join('\n    ');
const html = readFileSync(inputHtml, 'utf8');
if (!html.includes('</head>') || !html.includes('</body>')) {
  throw new Error(`${inputHtml} lacks </head> or </body>`);
}
writeFileSync(
  join(outDir, 'index.html'),
  html.replace('</head>', `  ${head}\n  </head>`).replace('</body>', `  ${body}\n  </body>`)
);
