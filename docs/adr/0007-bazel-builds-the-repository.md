# ADR-0007: Bazel builds the repository

- **Status:** Accepted (2026-11-06)
- **Relates to:** ADR-0001 (library taxonomy), ADR-0002 (the barrel is the public interface), ADR-0004 (cross-feature access), ADR-0006 (the e2e suite is its own project)
- **Linear:** DEV-7767

## Context

Until 2026-11 dsp-app was an Nx 23 and Angular 21 monorepo: one application, 28 libraries, 202 Jest spec files, a Storybook, a Cypress suite, an OpenAPI-generated client and the npm-published `@dasch-swiss/dsp-js`. Every other DaSCH build that matters for the platform's future (dsp-api, vitrinli, stellwerk, ark-resolver) is a Bazel 9 module with a Nix dev shell, a `justfile` as the CI contract, `rules_oci` images and the shared NativeLink remote-execution backend.

Three problems followed from the difference:

- **Boundaries were advisory.** ADR-0001's tiers were a lint rule with a single `*` to `*` constraint; a forbidden import was at best a review finding. With agents writing most of the code, review does not scale, and the build has to reject the wrong dependency.
- **dsp-app moves into dsp-api.** Moving it with Nx inside would put two task graphs, two caches and two CI contracts in one repository. The move is a subtree move only if dsp-app is already a Bazel module whose packages can be re-rooted.
- **The working loop depended on host state.** An agent needed `npm ci`, a Java runtime for the OpenAPI generator, a Chrome for Cypress, Playwright browsers for Storybook, Docker and mkdocs, each installed by hand. Nothing recorded what a working machine contained.

## Decision

1. **Bazel 9 with bzlmod builds and tests every library and the application, in the shape Angular's own repositories use.** (**structure**)

   Each library is one package built by `vre_library` (`tools/angular/defs.bzl`): `sass_binary` per stylesheet, `ng_project` over its sources with the compiled CSS as assets, a Jest target on its sources, the ESLint aspect, and `visibility` from ADR-0001. `dsp-js` is a `ts_project` and an `npm_package`. esbuild bundles the application from the compiled libraries, and `rules_oci` builds the image. This is `angular/components`' dev-app composition (`ng_project`, `sass_binary`, esbuild), so the rules have a maintained precedent; Jest and the hashed production bundle were proven by the spike that preceded the migration.

2. **Every command is a `just` recipe, and every tool Bazel cannot provide hermetically comes from the Nix dev shell.** (**structure**)

   CI runs `nix develop --command just <recipe>` and nothing else, so a developer and CI run the same commands. A fresh clone needs Nix, nix-direnv and Docker, nothing more. `just ci` is the gate. `eng.yaml` binds the recipes for the eng plugin's agents.

3. **Library boundaries are Bazel `visibility`.** (**structure**)

   ADR-0001 records the rules and their explicit exceptions. A forbidden edge fails `bazel build`, and `just visibility-check` proves each tier rule still rejects one.

4. **Stories are outside the boundary graph.** (**structure**)

   A library's compile excludes `*.stories.ts`, `*.spec.ts`, `test-setup.ts` and `stories.helpers.ts`, so an import only a story or a spec makes never becomes an edge of the library. The Storybook build globs the stories back in. It is no library, visibility does not apply to it, and a story's type error surfaces in `just storybook-build`, which `just ci` runs.

5. **`rules_angular` and `rules_sass` are consumed by `git_override` at pinned commits, and each pin follows a named upstream.** (**review**)

   Neither has releases. `rules_angular` is pinned to the commit Angular CLI 21.2.x pins, `rules_sass` to the commit `angular/components` pins; `MODULE.bazel` holds both. A pin moves only to a commit one of those repositories pins, by hand, with `just ci` green. `rules_angular` carries one patch, `tools/angular/rules_angular-nativelink.patch`, which lets its worker compile in NativeLink's work directory; a bump re-applies or drops it, never widens it.

6. **Remote execution and the remote cache run on NativeLink.** (**structure**)

   CI passes the remote flags through `BAZEL_FLAGS`, which every recipe appends to its Bazel calls. The patched `rules_angular` lets the Angular compile (`TsProject`) run remotely; the esbuild bundle runs remotely without changes.

7. **No bot updates dependencies.** (**review**)

   Renovate is disabled; library updates are analysed and made by hand. Bazel modules, the two commit pins, `.bazelversion`, `flake.nix` and `flake.lock` are bumped by hand, as in the sibling repositories. A `pnpm-lock.yaml` change needs no `MODULE.bazel.lock` refresh.

## Consequences

**Positive.** The build rejects a forbidden dependency. Every action is cached locally and remotely, so a change rebuilds the library, its dependents and the bundle, and a CI run of an unchanged graph replays from the cache. A clone works without manual setup. The later move into dsp-api is a re-rooting of packages under `//dsp-app/...` and one label rewrite.

**Negative and costs.**

- **No hot reload.** `just serve` rebuilds under `ibazel`; the page reloads by hand, and an edit takes tens of seconds to reach it where `ng serve` took about one. Accepted for now; agents do not need the page for most edits. `docs/contribution/bazel-baselines.md` records the numbers.
- **`styleUrl` names `.css` files that exist only in the output tree**, since `ng_project` takes the compiled CSS. The IDE's Angular language service reports them as missing; that is tolerated.
- **Unreleased rules.** `rules_angular` and `rules_sass` are commits, not releases, and upstream tests them on Bazel 8, not 9. Decision 5 is the policy that contains it.
- **Four libraries compile with loose TypeScript flags** (`tools/angular/loose.bzl`), each with an issue, because making them strict would change behaviour in a build-system change.

## Alternatives rejected

- **Bazel as an orchestrator only**, wrapping `ng build` and Nx in `js_run_binary`. Cheapest, with hermetic Node and sibling-consistent CI. Rejected: it gives neither a per-library graph nor `visibility`, the two things the migration is for, and it keeps Nx.
- **The Architect rules: ng-packagr per library and the Angular CLI builder for the bundle.** Keeps every CLI feature and the stylesheets as they were. Rejected: ng-packagr packages each library into Angular Package Format, which an in-repository consumer never needs; it is the slower rule family by its own README; and "ng-packagr libraries consumed by the CLI builder" has no public precedent, where `ng_project` with esbuild is how `angular/components` builds.
- **Keep Nx and enforce boundaries harder.** Tagging every library under `@nx/enforce-module-boundaries` was ADR-0001's first mechanism. Rejected with the rest of Nx: it leaves two build systems in the future dsp-api repository and does not touch the host-state problem.
- **The Dockerfile over a Bazel-built bundle.** The cheapest image. Rejected: every sibling ships `rules_oci` and its publish pipeline, and a Dockerfile would be the one non-Bazel artifact. The cost is that the image's health check moved to the compose file ops-deploy renders, because the OCI image format has no `HEALTHCHECK`.
- **Keep npm and derive `pnpm-lock.yaml` for Bazel only.** Rejected: two lockfiles drift, and `rules_js` refuses phantom dependencies either way, so the strict layout has to be the developer's layout too.
- **Clear ADR-0001's violating edges before enforcing.** The ADR's original rollout order. Rejected for the migration: it needs the refactors ADR-0004 and ADR-0005 describe. The tiers are enforced as the graph stands, and every remaining violation is an explicit, commented exception.
