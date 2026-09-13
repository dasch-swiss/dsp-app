# ADR-0006: The end-to-end suite is its own project

- **Status:** Accepted (2026-09-13)
- **Relates to:** ADR-0001 (library taxonomy), ADR-0002 (the barrel is the public interface)

## Context

The Cypress suite lives at `apps/dsp-app/cypress/`: twenty spec files plus page objects, models, fixtures and support helpers. It is not an Nx project of its own. It is a directory inside the application, and an `e2e` target on that application.

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

**Four things are nonetheless wrong, and they compound.**

1. **CI does not use any of it.** No workflow calls `nx run dsp-app:e2e` or either npm script. The `dsp-app-e2e-tests` job hand-rolls the whole sequence instead:

   ```yaml
   - run: npx nx run dsp-app:serve:production &
   - run: timeout 180 bash -c 'until curl -sf http://localhost:4200 ...; do sleep 3; done'
   - working-directory: apps/dsp-app
     run: npx cypress run --browser chrome --spec "${{ matrix.specs }}"
   ```

   A backgrounded server with no teardown, a hand-written readiness poll, and a hardcoded port, all of which `devServerTarget` already handles. The configured target is effectively dead code.

2. **Nothing type-checks the suite.** The tsconfig exists and is referenced, but a project reference is only resolved by `tsc --build`, and no target or CI step runs one over it. The reference is decorative.

3. **Nothing lints it.** `eslint.config.mjs:173` lists `apps/dsp-app/cypress/` under `ignores`. That removes it from every rule, `@nx/enforce-module-boundaries` included.

4. **So the imports have rotted, silently.** Four files import `'../../../../../libs/vre/open-api/src'`. That path has not existed since the library moved to `libs/vre/3rd-party-services/open-api`. Three more import `'../../../../../libs/dsp-js/src'`, a relative path that reaches past a library barrel. Both forms are precisely what `noRelativeOrAbsoluteImportsAcrossLibraries` rejects, and both would have been caught on the day they broke. The affected specs run green today because they are never compiled (DEV-7251).

The suite being a directory rather than a project is what makes 2, 3 and 4 possible. A project has its own lint target, its own type-check, and its own tags. A directory inside an application inherits the application's configuration, and in this case inherits an explicit exclusion from it.

## Decision

1. **The end-to-end suite becomes its own Nx project, `dsp-app-e2e`.** (**structure**)

   It moves to `apps/dsp-app-e2e/`, taking `cypress.config.ts`, the `cypress/` tree and its tsconfig. `apps/dsp-app/project.json` loses its `e2e` target; the new project gains it, unchanged apart from paths. `implicitDependencies: ["dsp-app"]` records the relationship that `devServerTarget` already implies.

2. **It is tagged `scope:app`, `type:e2e`, and `type:e2e` returns to the ADR-0001 taxonomy.** (**static-analysis**)

   ADR-0001 omitted `e2e` because no project could carry it. This ADR creates one. The constraint block gains:

   ```js
   { sourceTag: 'type:e2e', onlyDependOnLibsWithTags: ['type:data-access', 'type:util'] },
   ```

   Nothing can depend on an e2e project in return; Nx enforces that independently of tags, as it does for applications.

3. **The suite may import only `type:data-access` and `type:util` libraries, through path aliases.** (**static-analysis**)

   The specs legitimately need request and response shapes from `dsp-js` and the generated OpenAPI client to build fixtures. They do not need components, pages or UI libraries, and an end-to-end test that imports a component is testing the wrong thing.

   The seven rotted relative imports become alias imports: `@dasch-swiss/vre/3rd-party-services/open-api` and `@dasch-swiss/dsp-js`. That fixes the dead path and the barrel bypass in the same edit, and the boundary rule keeps them fixed.

4. **CI calls the Nx target.** (**structure**)

   The three hand-rolled steps collapse to `npx nx run dsp-app-e2e:e2e:production`. Nx starts the dev server, waits for it, runs Cypress against the spec list, and tears the server down. The matrix over spec groups stays; it is passed through as `--spec`.

   The Docker Compose steps that bring up `sipi`, `ingest` and `api` from the dsp-api repository stay exactly as they are. Nx manages this workspace's processes, not a sibling repository's backend, and this ADR does not pretend otherwise.

5. **The project is linted and type-checked like any other.** (**static-analysis**)

   `apps/dsp-app/cypress/` comes out of the `ignores` list in `eslint.config.mjs`, the new project is added to the `include` list of the `@nx/eslint/plugin` entry in `nx.json`, and its tsconfig is wired to a target that actually runs. This is what closes DEV-7251 structurally rather than by fixing the four files once.

## Consequences

**Positive.** The rotted imports are caught by the same rule that protects every other library, so the class of bug ends rather than the instance. CI loses a backgrounded process, a polling loop and a hardcoded port. `type:e2e` becomes meaningful, and the taxonomy in ADR-0001 stops carrying an apology. The suite gains a lint target and a type-check, which it has never had.

**Negative and costs.** Moving the directory rewrites every relative path inside the suite, which is a large but mechanical diff, and it will conflict with any in-flight branch touching Cypress. The `dsp-app-e2e-tests` workflow job needs rewriting, and a mistake there is invisible until the next PR that touches the app. Fixing the seven imports may surface real type errors that the suite has been hiding since the open-api library moved, so the true size of the change is not knowable until it type-checks once.

**This ADR is independently landable.** Unlike ADR-0001, which cannot switch on its constraint block until ADR-0004 and ADR-0005 are carried out, nothing here waits on the library migration. Tagging a new project is safe while `{ sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }` is still in place, per ADR-0001 decision 6.

## Alternatives rejected

- **Keep the suite inside `apps/dsp-app` and fix the three defects in place.** Genuinely viable, and cheaper. Remove the `ignores` entry, add a type-check target, point CI at the existing `e2e` target. It fixes all four numbered problems above without moving a single file. Rejected because the suite would still inherit the application's tags, so the boundary rule would grant it whatever the application may import, which is everything. The import restriction in decision 3 is the part that prevents recurrence, and it needs a tag of its own to express. A separate project is also the layout `nx g @nx/angular:application` produces, given this workspace's own `"e2eTestRunner": "cypress"` generator default, so it is the shape a future contributor will expect.
- **Move the suite to its own repository.** Decouples the test cadence from the application's, and is how some teams run cross-service suites. Rejected: it would lose `affected` entirely, so every change would run every spec, and it puts a repository boundary between a UI change and the test that covers it. The suite already depends on the app's dev server.
- **Ban workspace imports from the suite entirely (`onlyDependOnLibsWithTags: []`).** The strict reading, and consistent with ADR-0004's "share concepts, never shapes": the suite would declare its own request shapes rather than borrowing the client's. Rejected for now as disproportionate. It would mean hand-maintaining fixture types that already exist and drift, to remove a dependency that is type-only and points at the two most stable libraries in the workspace. Worth revisiting if the fixtures start breaking on client changes.
- **Switch runners to Playwright while moving things anyway.** The move touches every file in the suite, so it is the cheapest moment to change tooling, and Playwright is now the Nx default for new applications. Rejected: it would conflate a structural fix with a rewrite of twenty specs and all their page objects, and the current Cypress setup has no defect that Playwright fixes. This ADR is about where the suite lives, not what it is written in.
