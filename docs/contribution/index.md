# Development Documentation

This documentation is intended for the internal DaSCH development team.

## Setting Up

Install [Nix](https://nixos.org/download/), [nix-direnv](https://github.com/nix-community/nix-direnv)
and Docker; nothing else is installed by hand. In the repository root, `direnv allow` enters the dev
shell, which provides Bazel, `just`, pnpm, Node and Playwright's browsers. Then:

```shell
just install   # the npm dependencies from pnpm-lock.yaml
just ci        # the gate CI runs: build, tests, lint, Storybook build, the e2e type-check
just help      # every recipe
```

Bazel builds and tests every library and the application
([ADR 0007](../adr/0007-bazel-builds-the-repository.md)); the
[Build Baselines](bazel-baselines.md) record its measured numbers.

## For Users and Researchers

If you need support or have questions about using the DSP platform:

- Contact us at: <support@dasch.swiss>
- Visit our website: <https://dasch.swiss>

## Source Code

The DSP-APP is open source software available on [GitHub](https://github.com/dasch-swiss/dsp-app) under the Apache 2.0 license.
