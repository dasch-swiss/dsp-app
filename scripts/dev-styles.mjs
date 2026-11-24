// Local development only (`just ng-serve`): compiles each component stylesheet to the `.css`
// beside it that `styleUrl` names, as Bazel's sass_binary does (tools/angular/defs.bzl), so the
// Angular CLI finds it. The `.css` files are gitignored. With `--watch`, recompiles on any change.
import { execFileSync } from 'node:child_process';
import { watch, writeFileSync } from 'node:fs';
import * as sass from 'sass';

// What Bazel's sass_deps put on the load path: the shared partials, the shell's partials and
// node_modules for `@angular/material`.
const loadPaths = ['libs/vre/ui/styles', 'apps/dsp-app/src', 'node_modules'];
// The global stylesheet goes through angular.json's `styles`, not a `styleUrl`.
const GLOBAL = 'apps/dsp-app/src/styles.scss';

function stylesheets() {
  return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'libs/*.scss', 'apps/*.scss'], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(file => file && file !== GLOBAL && !/(^|\/)_[^/]+\.scss$/.test(file));
}

function compileAll() {
  let failed = 0;
  for (const scss of stylesheets()) {
    try {
      const { css } = sass.compile(scss, { loadPaths, silenceDeprecations: ['import'] });
      writeFileSync(scss.replace(/\.scss$/, '.css'), css);
    } catch (error) {
      failed++;
      console.error(`dev-styles: ${scss}: ${error.message}`);
    }
  }
  return failed;
}

const failed = compileAll();
if (process.argv.includes('--watch')) {
  let timer;
  for (const dir of ['libs', 'apps/dsp-app/src']) {
    watch(dir, { recursive: true }, (_event, file) => {
      if (!file?.endsWith('.scss')) return;
      clearTimeout(timer);
      // A partial can change any stylesheet: recompile them all (a few hundred milliseconds).
      timer = setTimeout(compileAll, 100);
    });
  }
} else if (failed) {
  process.exit(1);
}
