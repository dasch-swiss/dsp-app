#!/usr/bin/env bash
# Prints the passing spec files, passing tests and skipped tests per library from the JUnit reports
# of the last `bazel test`, in scripts/test-counts.sh's format, so the two compare line by line
# (docs/contribution/bazel-baselines.md). One <testsuite> is one spec file.
# Exits non-zero when any test failed or no report exists.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
TESTLOGS="$(bazel info bazel-testlogs 2>/dev/null)"

find "$TESTLOGS" -name test.xml | node -e '
const fs = require("fs");
const path = require("path");
const testlogs = process.argv[1];
const reports = fs.readFileSync(0, "utf8").trim().split("\n").filter(Boolean);
if (reports.length === 0) throw new Error(`no test.xml under ${testlogs}`);
const counts = {};
let failed = 0;
for (const report of reports.sort()) {
  // <testlogs>/<package>/<test name>/test.xml
  const pkg = path.dirname(path.dirname(path.relative(testlogs, report)));
  const c = (counts[pkg] ??= { files: 0, tests: 0, skipped: 0 });
  const xml = fs.readFileSync(report, "utf8");
  for (const suite of xml.matchAll(/<testsuite\b([^>]*)>/g)) {
    const attr = name => Number((suite[1].match(new RegExp(`\\b${name}="(\\d+)"`)) || [0, 0])[1]);
    const bad = attr("failures") + attr("errors");
    failed += bad;
    if (bad === 0) c.files += 1;
    c.tests += attr("tests") - bad - attr("skipped");
    c.skipped += attr("skipped");
  }
}
console.log(["library", "spec_files_passed", "tests_passed", "tests_skipped"].join("\t"));
const total = { files: 0, tests: 0, skipped: 0 };
for (const pkg of Object.keys(counts).sort()) {
  const c = counts[pkg];
  console.log([pkg, c.files, c.tests, c.skipped].join("\t"));
  for (const k of Object.keys(total)) total[k] += c[k];
}
console.log(["total", total.files, total.tests, total.skipped].join("\t"));
if (failed > 0) {
  console.error(`${failed} failed tests or suites`);
  process.exit(1);
}
' "$TESTLOGS"
