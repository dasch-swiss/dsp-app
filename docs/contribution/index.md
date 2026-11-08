# Development Documentation

This documentation is intended for the internal DaSCH development team.

## Setting Up

Install [Nix](https://nixos.org/download/) with flakes enabled (the Determinate installer CI uses
enables them), [direnv](https://direnv.net/) with its shell hook and
[nix-direnv](https://github.com/nix-community/nix-direnv). Docker is needed only for the dsp-api stack
the Cypress suite runs against (`just e2e-stack-up`, from a dsp-api checkout at `DSP_API_DIR`,
`../dsp-api` by default) and for the image recipes. In the repository root, `direnv allow` enters the
dev shell, which provides Bazel, `just`, pnpm, Node and Playwright's browsers. Then:

```shell
just install   # the npm dependencies from pnpm-lock.yaml
just ci        # the gate: build, tests, lint, Storybook build, e2e type-check, visibility and version checks
just help      # every recipe
```

CI runs `just ci` too, followed by `just lint-selftest` and the image smoke test
(`just nginx-smoke-test`) in the same job, and the Storybook interaction tests, the Cypress suite and
the docs build as jobs of their own. Without the CI remote cache, the first local build compiles everything.

Bazel builds and tests every library and the application
([ADR 0007](../adr/0007-bazel-builds-the-repository.md)); the
[Build Baselines](bazel-baselines.md) record its measured numbers.

## For Users and Researchers

If you need support or have questions about using the DSP platform:

- Contact us at: <support@dasch.swiss>
- Visit our website: <https://dasch.swiss>

## Source Code

The DSP-APP is open source software available on [GitHub](https://github.com/dasch-swiss/dsp-app) under the Apache 2.0 license.
