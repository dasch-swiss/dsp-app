# ADR-0006: The end-to-end suite is its own project

- **Status:** Accepted (2026-09-13); decision revised (2026-11-06) when Bazel replaced Nx ([ADR-0007](0007-bazel-builds-the-repository.md))
- **Relates to:** ADR-0001 (library taxonomy), ADR-0002 (the barrel is the public interface), ADR-0007 (Bazel builds the repository)

## Context

The Cypress suite lives at `apps/dsp-app/cypress/`: twenty spec files plus page objects, models, fixtures and support helpers. This section describes it as it was under Nx when the record was written. It was not an Nx project of its own. It is a directory inside the application, and an `e2e` target on that application.

**Most of the Nx wiring is already there, and is better than it looks.** `apps/dsp-app/project.json` defines a working target:

```json
"e2e": {
  "executor": "@nx/cypress:cypress",
  "options": { "cypressConfig": "apps/dsp-app/cypress.config.ts" },
  "configurations": {
    "production":  { "devServerTarget": "dsp-app:serve:production",  "env": { "API_URL": "..." } },
    "development": { "devServerTarget": "dsp-app:serve:development", "env": { "API_URL": "..." } },
    "cypress-cloud": { "devServerTarget": "dsp-app:serve:development", "record": true, "env": { "API_URL": "..." } }
  }
}
```

`package.json` exposes it as `e2e-ci` and `e2e-ci-dev`. `cypress.config.ts` builds on `nxE2EPreset` from `@nx/cypress`. `apps/dsp-app/cypress/tsconfig.json` exists, includes `**/*.ts`, and is listed in the `references` array of `apps/dsp-app/tsconfig.json`. Somebody set this up properly.

**Four things were nonetheless wrong when this record was written, and they compound.** Two of them have since been patched in place by #3434; the structural cause remains, and so does the case for this decision.

1. **CI does not use any of it.** No workflow calls `nx run dsp-app:e2e` or either npm script. The `dsp-app-e2e-tests` job hand-rolls the whole sequence instead:

   ```yaml
   - run: npx nx run dsp-app:serve:production &
   - run: timeout 180 bash -c 'until curl -sf http://localhost:4200 ...; do sleep 3; done'
   - working-directory: apps/dsp-app
     run: npx cypress run --browser chrome --spec "${{ matrix.specs }}"
   ```

   A backgrounded server with no teardown, a hand-written readiness poll, and a hardcoded port, all of which `devServerTarget` already handles. The configured target is effectively dead code.

2. **Nothing type-checked the suite.** The tsconfig exists and is referenced, but a project reference is only resolved by `tsc --build`, and until #3434 no target or CI step ran one over it. That PR added a `Type-check e2e specs` step to the `dsp-app-e2e-tests` job running `npx tsc --noEmit -p apps/dsp-app/cypress/tsconfig.json`. It works, and it is one more hand-rolled step that no Nx target knows about, which is item 1 again.

3. **Nothing lints it.** `eslint.config.mjs:173` lists `apps/dsp-app/cypress/` under `ignores`. That removes it from every rule, `@nx/enforce-module-boundaries` included.

4. **So the imports had rotted, silently.** When this record was written, nine relative imports, one per file, reached out of the suite, and two of the three libraries they named were gone, which accounts for five of the nine:

   | Imported path | Sites | State then |
   | --- | --- | --- |
   | `../../../../../libs/vre/open-api/src` | 4 | **gone**, the library moved to `libs/vre/3rd-party-services/open-api` |
   | `../../../../../libs/dsp-js/src` | 4 | exists; the path resolves to the barrel itself, but bypasses the `@dasch-swiss/dsp-js` alias |
   | `../../../../../libs/vre/shared/app-representations/src` | 1 | **gone**, no library exists at any path |

   Every one of these forms is precisely what `noRelativeOrAbsoluteImportsAcrossLibraries` rejects, and all of them would have been caught on the day they broke. The affected specs ran green because they were never compiled (DEV-7251). #3434 repointed the open-api imports to their alias and declared `UploadedFileResponse` locally in `support/helpers/file-uploader.ts`, which was the right call: the type is internal to `resource-editor`, and an end-to-end suite should not import a component library to get it. What remains are four relative imports of `libs/dsp-js/src`, in `support/commands.ts`, `support/commands/ontology-command.ts`, `e2e/system-admin/data-model-class.cy.ts` and `e2e/system-admin/ontology.cy.ts`, each bypassing the alias.

The suite being a directory rather than a project is what made 2, 3 and 4 possible, and is why the fix for 2 had to be a hand-rolled step. A project has its own lint target, its own type-check, and its own tags. A directory inside an application inherits the application's configuration, and in this case inherits an explicit exclusion from it.

## Decision

The first version of this record made the suite an Nx project, `dsp-app-e2e`, with `implicitDependencies: ["dsp-app"]`, an Nx `e2e` target and a `type:e2e` tag constrained to `type:data-access` and `type:util`. Bazel replaced Nx before that move was made (ADR-0007), so none of it exists. The intent survives: the suite has its own type-check, its own run and its own import rule, each a `just` recipe or a stated review rule rather than a hand-rolled CI step.

1. **The suite stays at `apps/dsp-app/cypress/`, with its own tsconfig and its own recipes, and is no Bazel target.** (**structure**)

   The Cypress binary, its browser and the dsp-api stack it runs against are not hermetic, so a Bazel test target would either lie about its inputs or not cache. The recipes are the suite's interface, as a project's targets would have been. Moving the directory buys nothing a recipe does not, so it does not move.

2. **`just typecheck-e2e` type-checks the suite, and `just ci` runs it.** (**static-analysis**)

   `pnpm exec tsc --noEmit -p apps/dsp-app/cypress/tsconfig.json` after the generated client is in place. It replaces the hand-rolled CI step #3434 added, and because it is part of `just ci` it runs on every PR and on a developer's machine alike. This is what stops the rot item 4 describes.

3. **The suite may import only `dsp-js` and the generated OpenAPI client, through their path aliases.** (**review**)

   The specs legitimately need request and response shapes from `dsp-js` and the generated OpenAPI client to build fixtures. They do not need components, pages or UI libraries, and an end-to-end test that imports a component is testing the wrong thing.

   The four relative imports of `libs/dsp-js/src` are now `@dasch-swiss/dsp-js` alias imports. The tsconfig extends `tsconfig.base.json`, so every alias resolves; nothing but review keeps the suite to these two, which is a step down from the `type:e2e` constraint this record first chose.

4. **The run is a `just` recipe, and CI calls it.** (**structure**)

   `just e2e-stack-up` brings up the dsp-api stack from the checkout `DSP_API_DIR` names, with a fresh test database. `just e2e <specs>` builds the production bundle with Bazel, serves it on port 4200, waits for it, runs Cypress over the specs and stops the server when it exits. The `dsp-app-e2e-tests` job runs `just e2e-stack-up`, `just typecheck-e2e` and `just e2e "$SPECS"` over its matrix of spec groups. The backgrounded server, the polling loop and the hardcoded wait are gone from the workflow.

5. **The suite is linted like any other code. Not yet carried out.** (**review**)

   `apps/dsp-app/cypress/` is still in the `ignores` list of `eslint.config.mjs`, so ESLint skips it and `no-restricted-imports` does not check it. Removing that entry is the open half of this record.

## Consequences

**Positive.** The suite's type-check runs in the gate, so a rotted import fails the PR that causes it. CI lost a backgrounded process, a polling loop and a hardcoded port, and a developer runs the same recipes CI does.

**Negative and costs.** The import rule in decision 3 is review, not a tool, and the suite is still unlinted. The `type:e2e` taxonomy entry ADR-0001 once anticipated does not exist.

**This record no longer waits on anything.** Decisions 1 to 4 hold today; decision 5 is one `ignores` entry and whatever ESLint then reports.

## Alternatives rejected

- **Keep the suite inside `apps/dsp-app` and fix the three defects in place.** Genuinely viable, and cheaper. Remove the `ignores` entry, add a type-check target, point CI at the existing `e2e` target. It fixes all four numbered problems above without moving a single file. Rejected at the time because the suite would inherit the application's tags, so the boundary rule would grant it whatever the application may import, which is everything. Under Bazel this is what happened after all, by the route decision 1 states: the suite stays in place, with recipes of its own.
- **Move the suite to its own repository.** Decouples the test cadence from the application's, and is how some teams run cross-service suites. Rejected: it would lose the shared change detection, so every change would run every spec, and it puts a repository boundary between a UI change and the test that covers it. The suite already depends on the app's dev server.
- **Ban workspace imports from the suite entirely (`onlyDependOnLibsWithTags: []`).** The strict reading, and consistent with ADR-0004's "share concepts, never shapes": the suite would declare its own request shapes rather than borrowing the client's. Rejected for now as disproportionate. It would mean hand-maintaining fixture types that already exist and drift, to remove a dependency that is type-only and points at the two most stable libraries in the workspace. Worth revisiting if the fixtures start breaking on client changes.
- **Switch runners to Playwright while moving things anyway.** The move touches every file in the suite, so it is the cheapest moment to change tooling, and Playwright is now the Nx default for new applications. Rejected: it would conflate a structural fix with a rewrite of twenty specs and all their page objects, and the current Cypress setup has no defect that Playwright fixes. This ADR is about where the suite lives, not what it is written in.
