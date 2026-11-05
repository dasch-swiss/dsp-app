#!/usr/bin/env bash
# Prints the passing Jest spec files, passing tests and skipped tests per library, one line per
# project with a jest.config.ts, so two runs compare line by line (docs/contribution/bazel-baselines.md).
# Runs every project through the root multi-project Jest config with the CI environment.
# Exits non-zero when any test failed.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
REPORT="$(mktemp -t jest-report.XXXXXX)"
trap 'rm -f "$REPORT"' EXIT

TZ=Europe/Zurich NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}" \
  npx jest --config jest.config.ts --ci --json --outputFile="$REPORT" >/dev/null 2>&1 || true

git ls-files '*/jest.config.ts' | xargs -n1 dirname | node -e '
const fs = require("fs");
const path = require("path");
const roots = fs.readFileSync(0, "utf8").trim().split("\n").sort((a, b) => b.length - a.length);
const report = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const counts = Object.fromEntries(roots.map(r => [r, { files: 0, tests: 0, skipped: 0 }]));
let failed = 0;
for (const file of report.testResults) {
  const rel = path.relative(process.cwd(), file.name);
  const root = roots.find(r => rel.startsWith(r + "/"));
  const count = status => file.assertionResults.filter(a => a.status === status).length;
  if (!root) throw new Error(`no project owns ${rel}`);
  // A file with a skipped test reports a status other than "passed"; only a failure disqualifies it.
  if (file.status === "failed" || count("failed") > 0) {
    failed += Math.max(count("failed"), 1);
  } else {
    counts[root].files += 1;
  }
  counts[root].tests += count("passed");
  counts[root].skipped += count("pending") + count("skipped") + count("todo");
}
console.log(["library", "spec_files_passed", "tests_passed", "tests_skipped"].join("\t"));
const total = { files: 0, tests: 0, skipped: 0 };
for (const root of [...roots].sort()) {
  const c = counts[root];
  console.log([root, c.files, c.tests, c.skipped].join("\t"));
  for (const k of Object.keys(total)) total[k] += c[k];
}
console.log(["total", total.files, total.tests, total.skipped].join("\t"));
if (failed > 0) {
  console.error(`${failed} failed tests or suites`);
  process.exit(1);
}
' "$REPORT"
