# dsp-app Code Review Checklist

Agent reference card for the review phase. Pair with `CONVENTIONS.md` (work phase). Authoritative detail lives in `docs/`.

What blocks a merge is set by the review prompt in `.github/workflows/claude.yml`. This file adds what to check and what to skip; it does not change severity.

## Always Check

### Build & history

- The PR title follows Conventional Commits, stays within 140 characters and carries the Linear id when there is one (`CONVENTIONS.md` § Commit Conventions).
- Every change serves the PR's stated goal: no unrelated SCSS, config or test-setup edits, and no hand edits under a generated path.
- A delete, rename or move leaves no reference behind in `docs/`, `README.md`, `CLAUDE.md`, `CONVENTIONS.md`, `ARCH-MAP.md` or the PR description.

### Architecture & layering

- Read the Boundary rules of every `ARCH-MAP.md` component the diff touches. Most are tagged `docs-only`: review is the only check they get.
- No feature library imports another feature library (ADR-0004 d1). Lint does not catch this yet: `depConstraints` is still `* -> *` until the ADR-0001 rollout.
- Two features needing the same code: relocate it (ADR-0004 d2), or declare a port in the consumer and wire it in `apps/dsp-app` (d4). Cross-feature references are opaque ids (d5). A generated OpenAPI DTO does not become shared code because two places need a similar shape (d6).
- Feature state is provided by the feature, not `providedIn: 'root'` (ADR-0003 d1, d3). One writer per value (d4). State that must survive navigation lives in the URL (d5).
- A new library barrel uses curated named exports (ADR-0002 d3). A boundary-rule suppression carries a reason (d2). Removing an export from `libs/dsp-js/src/index.ts` breaks NPM consumers (d5).
- Code that two features need goes into a new library named for what it holds, not added to `app-common`, `app-helper-services` or `app-common-to-move` (ADR-0005 d3, d4); changing code already there is fine. A generic `ui/*` library takes no domain logic.
- DSP-API calls live in a `*ApiService` under `3rd-party-services/api`, and a new API field is added to the client the consuming path reads (`CONVENTIONS.md` § Library Boundaries, `CLAUDE.md` § Working with APIs).
- An existing component, pipe or helper that already does the job is reused, not reimplemented next to it.

### Error handling & loading state

- Every new request path has a failure branch that ends the loading state and shows an error or empty state: no spinner that spins forever, no count failure that blanks or invents results (`CONVENTIONS.md` § Error Handling).
- State from a previous request (counts, error text, result lists) is reset when a request fails or a new query starts.
- A change in `vre/core/error-handler` still reports to Sentry from every branch, HTTP errors included.
- Subscriptions end with `takeUntilDestroyed`; nothing subscribes inside a getter or in `ngOnChanges` without teardown (`CONVENTIONS.md` § RxJS).

### dsp-js & JSON-LD

- A new dsp-js `@JsonProperty` is optional (third argument `true`) unless the server always sends the key (`ARCH-MAP.md` § dsp-js).
- Custom v2 endpoints use a coercing converter for array fields and send `Content-Type: application/ld+json` (`CLAUDE.md` § JSON-LD Gotchas).

### Templates & i18n

- Every user-visible string goes through a translation key, including `mat-error`, tooltips and snackbar messages.
- A new or changed key exists in `en.json`, `de.json`, `fr.json` and `it.json` (key parity, `apps/dsp-app/src/assets/i18n/CLAUDE.md`). A key whose meaning changes gets a new key. No `rm.json`.
- Media queries use `bp-up` / `bp-down`; no `::ng-deep` (`CONVENTIONS.md` § Components).
- Elements are reached through `@ViewChild` or a service, not `document.getElementById` or a CSS selector query.
- No static `style="…"` attribute; dynamic `[style.x]` bindings for computed values are fine.
- No new component-method call in a binding or interpolation; use a pipe, `computed()` or a field. Signal reads are not method calls.
- Colors come from the palettes in `apps/dsp-app/src/styles/_config.scss`; no new hex or rgb value in a component's SCSS or template.

### Tests & stories

- A component that gains an injected dependency: every spec and story that renders it for real provides or stubs the new dependency (`CLAUDE.md` § Storybook Convention).
- No newly skipped spec or Cypress test without a reason in the PR.
- No new test whose assertion another test already covers, down to a single `it` in a spec or a story's `play()` step.

## Style

- Injected fields are `private readonly _name`.
- No new `any`. No widening a type to `| null` or `| undefined` without a reason.
- An output that carries no value is `EventEmitter<void>`.
- Reactive forms stay typed: no `UntypedForm*`, `FormControl<any>` or bare `FormGroup` (`CONVENTIONS.md` § Forms, Material and Translation).
- Empty SCSS files and exports the diff leaves unused are removed.
- New comments follow `CONVENTIONS.md` § Comments: no history, no Linear ids, no restatement of the code or story name.

## Skip

- Issues on lines the diff does not change, or behaviour it does not alter. Pre-existing problems go in a separate follow-up list, never into the findings.
- "Add tests" or "coverage is missing" without naming a behaviour that could regress.
- Requests for JSDoc or explanatory comments (`CONVENTIONS.md` § Comments deletes by default).
- "Verify X" without a named failure: compatibility checks on dependency bumps, "this import should be verified", informational or "good practice" notes.
- Asking to run what CI already runs: lint, Jest, Storybook interaction tests, E2E.
- JSON-LD single values serialized as scalars: that is how compaction works (`CLAUDE.md` § JSON-LD Gotchas).
- Version skew between dsp-app and dsp-api: they ship in the same release. The dsp-js NPM barrel is the exception (ADR-0002 d5).
- Behaviour the linked Linear issue explicitly requires.
- States DSP does not produce, such as a resource without a label or without a class.
- Formatting and import order: Prettier and ESLint enforce them.
- Translation wording in `de.json`, `fr.json` and `it.json`; key parity is still checked above.
- Visual diffs: the `Pixeleye – dasch-swiss/dsp-app` status check owns them.
- Generated and release-managed files: `libs/vre/3rd-party-services/open-api/dsp-api_spec.yaml` (not the rest of that library: `src/lib/` is hand-written), `package-lock.json`, `CHANGELOG.md`, `.release-please-manifest.json`.
- PRs opened by `renovate[bot]` or `dasch-bot-app[bot]`.
