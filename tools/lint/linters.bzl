"""The ESLint aspect `just lint` applies through `--config=lint` in .bazelrc."""

load("@aspect_rules_lint//lint:eslint.bzl", "lint_eslint_aspect")
load("//tools/angular:visibility.bzl", "LIBRARIES")

eslint = lint_eslint_aspect(
    binary = Label("//tools/lint:eslint"),
    # Every package's config (tools/angular's eslint_config); ESLint picks the nearest one above
    # each file, as it does in the source tree.
    configs = [Label("//:eslintrc"), Label("//libs/dsp-js:eslintrc")] + [
        Label(package + ":eslintrc")
        for package in LIBRARIES
    ],
    # ng_project and ts_project both report this kind; `ts_project_rule` matches nothing.
    rule_kinds = ["ts_project"],
    args = ["--flag", "v10_config_lookup_from_file"],
)
