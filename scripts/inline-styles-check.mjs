#!/usr/bin/env node
// Usage: scripts/inline-styles-check.mjs [file ...]
// Fails when a component's inline `styles:` holds Sass: a `$variable`, `@use`, `@import`,
// `@include`, `@mixin`, `@extend`, a `//` comment, or a nested rule. ng_project passes inline styles
// through as CSS without an error, while Storybook still compiles them as SCSS, so Sass there
// renders in Storybook and Pixeleye but breaks in the bundle (CONVENTIONS.md, Styles).
// With no arguments it checks every tracked `*.ts` under libs/ and apps/.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const files =
  process.argv.length > 2
    ? process.argv.slice(2)
    : execFileSync('git', ['ls-files', 'libs/**/*.ts', 'apps/**/*.ts'], { encoding: 'utf8' })
        .split('\n')
        .filter(Boolean);

// At-rules whose body holds rules, so a rule inside them is not nesting.
const GROUPING = /^@(media|supports|container|layer|document|scope|starting-style)\b/;
const KEYFRAMES = /^@(-[a-z]+-)?keyframes\b/;

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

// The template literals of each `styles:` property, with their offsets in the file.
function inlineStyles(text) {
  const blocks = [];
  for (const m of text.matchAll(/\bstyles\s*:\s*(\[|`)/g)) {
    let i = m.index + m[0].length - 1;
    const end = m[1] === '[' ? text.indexOf(']', i) : i + 1;
    while (true) {
      const open = text.indexOf('`', i);
      if (open < 0 || (m[1] === '[' && open > end) || (m[1] === '`' && open > i)) break;
      const close = text.indexOf('`', open + 1);
      if (close < 0) break;
      blocks.push({ css: text.slice(open + 1, close), offset: open + 1 });
      i = close + 1;
      if (m[1] === '`') break;
    }
  }
  return blocks;
}

function check(css) {
  const findings = [];
  const add = (index, message) => findings.push({ index, message });
  // Strip /* */ comments and strings, keeping offsets, so their content is not checked.
  const code = css.replace(/\/\*[\s\S]*?\*\/|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, s => s.replace(/[^\n]/g, ' '));
  for (const m of code.matchAll(/(^|[^:\w])\/\//g)) add(m.index + m[1].length, '`//` comment');
  for (const m of code.matchAll(/\$[a-zA-Z_][\w-]*/g)) add(m.index, `Sass variable \`${m[0]}\``);
  for (const m of code.matchAll(/@(use|import|include|mixin|extend|forward|if|each|function)\b/g))
    add(m.index, `\`${m[0]}\``);
  // Nesting: a `{` that opens a rule while another rule (not a grouping at-rule) is open.
  const stack = [];
  let start = 0;
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (c === '{') {
      const prelude = code.slice(start, i).trim();
      const parent = stack[stack.length - 1];
      const kind = GROUPING.test(prelude) ? 'group' : KEYFRAMES.test(prelude) ? 'keyframes' : 'rule';
      if (parent === 'rule' && kind !== 'group') add(i, `nested rule \`${prelude.split('\n').pop().trim()}\``);
      stack.push(parent === 'keyframes' ? 'frame' : kind);
      start = i + 1;
    } else if (c === '}') {
      stack.pop();
      start = i + 1;
    } else if (c === ';') {
      start = i + 1;
    }
  }
  return findings;
}

let failed = 0;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (!/\bstyles\s*:/.test(text)) continue;
  for (const { css, offset } of inlineStyles(text)) {
    for (const { index, message } of check(css)) {
      console.error(`${file}:${lineOf(text, offset + index)}: inline styles are plain CSS: ${message}`);
      failed++;
    }
  }
}
if (failed) {
  console.error(`inline-styles-check: ${failed} finding(s); move Sass to a .scss file or write plain CSS`);
  process.exit(1);
}
