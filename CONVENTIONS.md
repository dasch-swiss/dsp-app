# dsp-app Architectural Conventions

Agent reference card for the work phase. Pair with `REVIEW.md`. Authoritative detail lives in `docs/`.

Project-specific architectural context for the dsp-app repository.
Build commands and gotchas live in [`CLAUDE.md`](CLAUDE.md), the library topology in [`ARCH-MAP.md`](ARCH-MAP.md), and the domain vocabulary in [`CONTEXT.md`](CONTEXT.md).

## Stack

- Angular 21, TypeScript 5.9, RxJS, Angular Material, ngx-translate — see [`package.json`](package.json) for exact versions.
- Nx monorepo: the app in `apps/dsp-app`, feature libraries under `libs/vre/`, the API client in `libs/dsp-js/`.
- Jest for unit tests, Cypress for e2e, Storybook for component interaction tests.
- ESLint (`eslint.config.mjs`, `eslint.config.angular.mjs`) and Prettier.

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Selectors | `app-` prefix, kebab-case for components (not lint-enforced); camelCase attribute for directives (lint-enforced) | `selector: 'app-my-component'` |
| Private fields | `_camelCase` | `private readonly _apiService` |
| Injected services | `private readonly _name`, abbreviations allowed | `_cd`, `_translateService` |
| Constants | `UPPER_CASE` | `PERMISSION_HEADERS` |
| Translation keys | dotted paths | `'resourceEditor.representations.video.cannotPlay'` |

## Comments

- A comment states what the reader must not break, never what the session discovered. Test: would it still be true and useful for someone who never saw the change that added it?
- Keep: an invariant a reader would otherwise break, a non-obvious third-party contract (lifetime, ownership, error/return semantics), the public API contract. One or two sentences each.
- Move out: what a change fixed or a test caught → commit body or PR; probe tables, benchmarks, corpus counts → `docs/` or a learning; a rejected alternative → a docs page or ADR, leaving one line and a link in the source.
- Delete: restatements of the code below, history ("previously", "now uses", "was changed to"), and any REQ id, user story, or plan-phase reference. A `TODO` without an issue id belongs in the tracker. A doc comment on an item a caller reaches is not a restatement: it is API surface, measured against what a caller needs rather than against the line below it.
- A PR description describes the code and the diff, never the commit history. "Commit 1 did X, commit 2 fixed Y" describes the journey.
- A "why" longer than about five lines belongs in a file; the comment becomes a pointer to it. A block past ~12 lines is a routing signal.
- Delete by default, when adding and when trimming: per sentence, name what a reader breaks without it, cut the ones with no answer, unclear included, and hold each survivor to one or two sentences.
- Doc comments use JSDoc.

## Components

- Components are standalone (the Angular 21 default, so omit `standalone: true`) and list their dependencies in `imports: []`, never in NgModule `declarations`.
- New components use `ChangeDetectionStrategy.OnPush`. With OnPush, call `this._cd.markForCheck()` after an async state change, or the view does not update.
- Prefer an inline `template:` over `templateUrl:` for small templates.
- Use `@if`, `@for` (with `track` on a unique id) and `@switch`. `*ngIf`, `*ngFor` and `*ngSwitch` fail lint (`prefer-control-flow`).
- Self-closing tags for component selectors in templates. Do not use `::ng-deep`.
- Media queries use `bp-up` / `bp-down` from `apps/dsp-app/src/styles/_responsive.scss` (`@use "responsive" as *`); never hardcode pixel breakpoints. `sm` (768px) is the minimum supported width.
- Inputs: `@Input({ required: true }) name!: T` for mandatory inputs — the `!` only there — and `@Input() name = default` for optional ones. Outputs are typed: `@Output() loaded = new EventEmitter<boolean>()`. Signal inputs and outputs (`input.required<T>()`, `input<T>(default)`, `output<T>()`) are allowed in new components.
- Put `data-cy` attributes on interactive elements; e2e and Storybook tests select by them.

## Dependency Injection

- Prefer `inject()` field injection in new code: `private readonly _apiService = inject(APIV2ApiService)`. Constructor injection is still common in existing code, and the `prefer-inject` lint rule is off, so do not rewrite working code only to convert it.
- Inject InjectionTokens the same way: `inject(DspApiConnectionToken)`, `inject(MAT_DIALOG_DATA)`. The tokens are typed, so the field needs no annotation. `@Inject(Token)` belongs only in existing constructor-injected code.
- Use `{ optional: true }` for optional services. Mark every injected field `readonly`.

## Library Boundaries

Layer ownership, barrel exports and cross-feature access are recorded in [`ARCH-MAP.md`](ARCH-MAP.md) and the [ADRs](docs/adr/index.md). The short form:

- HTTP calls to DSP-API live in `libs/vre/3rd-party-services/api` as a dedicated `*ApiService`, never inline in a component or in `shared/` (precedent: `ResourceLegalV2ApiService`, `LegalInfoApiService`).
- Per-project caching of API data goes into a helper service, not into each consuming component (precedent: `ProjectDataRightsService` in `shared/app-helper-services`).
- Imports cross libraries only through the `@dasch-swiss/vre/*` aliases and a library's barrel `index.ts`. Moving a file between libraries means updating both barrels.
- Know which client carries your data: dsp-js models or the generated OpenAPI client. See "Working with APIs" in [`CLAUDE.md`](CLAUDE.md).

## RxJS

- End subscriptions with `takeUntilDestroyed(this._destroyRef)` as the last operator, not a stored `Subscription` and a manual `unsubscribe()`. An operator after it that subscribes to an inner stream (`switchMap`, `mergeMap`) outlives the component.
- Use `finalize()` for cleanup that must run on both completion and error, for example resetting a loading flag.
- Handle errors with `catchError()`. Return `EMPTY` when the stream must simply complete.

```typescript
this._apiService.getData().pipe(
  finalize(() => { this.loading = false; this._cd.markForCheck(); }),
  catchError(() => { this.failedToLoad = true; return EMPTY; }),
  takeUntilDestroyed(this._destroyRef),
).subscribe(res => { this.data = res; });
```

## Forms, Material and Translation

- Reactive forms use typed `FormControl<T>`. Show errors with `@if (control.errors; as errors)` inside a `mat-form-field` with `mat-error`.
- Open dialogs with typed generics: `MatDialog.open<Component, DataType>()`. Icon buttons carry a translated `[matTooltip]`.
- Import only the Material modules a component uses.
- Use `TranslatePipe` in templates and `TranslateService.instant()` in code. Translation files live in `apps/dsp-app/src/assets/i18n/`. Add a new key to every language file there.

## Configuration Pattern

Per-environment settings live in `apps/dsp-app/src/config/config.*.json` and reach code through `AppConfigService` (`libs/vre/core/config`). The DSP-API connection is provided through `DspApiConfigToken` and `DspApiConnectionToken` from the same library. Inject those; do not build a `KnoraApiConfig` or read a config file in a component.

## Error Handling

- API errors in a component: `catchError()` sets a user-visible state (for example `failedToLoad`) and returns `EMPTY`. Do not swallow an error without a visible state.
- User-facing messages go through `NotificationService` and translation keys, never a raw error string.

## Testing Conventions

- Tested means: a Jest spec beside the file (`*.spec.ts`) for logic and component behaviour, and a Storybook story with a `play()` assertion for a UI component (see "Storybook Convention" in [`CLAUDE.md`](CLAUDE.md)). Cypress e2e lives in its own project ([ADR 0006](docs/adr/0006-the-e2e-suite-is-its-own-project.md)).
- Component specs use `TestBed.configureTestingModule()` with `imports: [TheComponent]`, `CUSTOM_ELEMENTS_SCHEMA` for child elements, `.overrideComponent()` to stub a template, and `provideTranslateService()`.
- Type mocks as `jest.Mocked<Partial<Service>>` and provide them with `useValue`. Clear mocks in `afterEach()`.
- Do not commit a focused test (`fdescribe`, `fit`, `.only`). Lint rejects it.

## Commit Conventions

- Conventional Commits: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, with an optional scope such as `feat(resource-editor):`. release-please bumps the version on `feat` and `fix`; every type except `perf` also gets a changelog section (`release-please-config.json`).
- The repo squash-merges, so the PR title becomes the commit on `main`. The `Check PR Title` workflow requires the Conventional Commits format and at most 140 characters.
- Put the Linear issue id in the title when there is one, for example `fix(ontology): translate validator error messages (DEV-7283)`.

## Reviewers & Git History

Before opening a PR, read `main`'s `git log` and recent merged PRs. Use them for two things: to confirm the commit-message and PR-title conventions above hold in practice, and to find reviewers — the people who have recently authored or committed changes to the files this PR touches. This repo keeps no `CODEOWNERS`, so git history is the reviewer signal, and it is the ground truth for PR-title format wherever the Commit Conventions section above doesn't cover an edge case.

## Before Committing

These must be clean:

- `npm run lint-all` — ESLint across all projects, including the alphabetical `import/order` rule. `npm run lint-fix-all` fixes what it can.
- `npm run test-ci-all` — every project's Jest suite.
- `npx nx build dsp-app`: the type-check, since lint is not type-aware.
- `npm run test-storybook`, with `npm run storybook` running, when you changed a component that has stories.

## Where to Go for Depth

- [`ARCH-MAP.md`](ARCH-MAP.md) — library topology, ownership and dependency direction.
- [`CONTEXT.md`](CONTEXT.md) — domain vocabulary.
- [`docs/adr/`](docs/adr/index.md) — architecture decisions: library taxonomy, barrels, feature state, cross-feature access, what "shared" means.
- [`docs/contribution/`](docs/contribution/index.md) — documentation and release-notes guidance.
- [`CLAUDE.md`](CLAUDE.md) — commands, Storybook convention, i18n, dsp-js and OpenAPI client gotchas.
