# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Claude Code Operating Rules

### 1. Non-Repository File System Safety

- The assistant must **not** modify, create, move, or delete files or directories **outside the project repository** unless explicitly instructed by the user.
- If the assistant detects that a requested operation would affect the broader system (e.g., user home directory, OS configuration, global environment files, unrelated projects), it must:
  - Clearly **highlight** this fact to the user  
  - Explain potential risks or side effects  
  - Request explicit, unambiguous permission before proceeding  
- If the user does not explicitly grant permission, the assistant must refuse to perform the operation and propose safe alternatives when possible.

### 2. Planning & Execution

- If a task includes multiple scopes (e.g., refactor + feature + tests), confirm whether to treat them separately.

### 3. Proposing Solutions

- If repository conventions conflict with best practices, ask which to prioritize.  
- If user instructions conflict with conventions or principles, seek clarification.

### 4. Testing Guidelines

- Add tests only within the **scope of the task**.  
- Avoid over-testing or redundant tests; check existing coverage first.  
- Cover meaningful edge cases and ensure regression safety.  
- Follow repository test conventions unless directed otherwise.  
- Suggest tests for unrelated components only as follow-up items.

## Project Overview

This is DaSCH Service Platform (DSP) monorepo - a digital humanities platform for storing, sharing, and working with primary research resources and data. Built with Angular, NX, and Node.js (see [package.json](package.json) for current versions).

The main application is **DSP-APP** - a user interface for the Swiss National Data and Service Center for the Humanities (DaSCH) research data repository, connecting to DSP-API backend and implementing DSP-JS client library.

## Essential Development Commands

Standard `nx` / `npm` invocations live in `package.json` scripts. Regenerating the generated OpenAPI client has a deploy-coupling gotcha — `check-openapi-sync` compares the vendored spec against the live dev API, so a red check is *expected* until the dsp-api change is deployed to dev. **Never edit the vendored spec to silence it.** Use the `/update-openapi-client` skill for the full sequence.

## Architecture Overview

### VRE Library Architecture

**Layer ownership rules:**
- Services that call the DSP-API over HTTP belong in `libs/vre/3rd-party-services/api` — not in `shared/` or inline in components. Extract inline HTTP calls into a dedicated `*ApiService` there (precedent: `ResourceLegalV2ApiService`, `LegalInfoApiService`).
- Per-project caching of API data goes into a helper service (precedent: `ProjectDataRightsService` in `shared/app-helper-services`), not into each consuming component.
- When moving a file between libs, update the barrel `index.ts` exports of both libs — imports go through `@dasch-swiss/vre/*` aliases, so a missed barrel export breaks consumers at build time.

### Project Images

- Project cover images live in `apps/dsp-app/src/assets/images/project/width-500/` as `{shortcode}.webp` files
- Use the `/format-project-image` skill to add or update project images (handles resize, conversion, optimization)
- See [`apps/dsp-app/src/assets/images/project/CLAUDE.md`](apps/dsp-app/src/assets/images/project/CLAUDE.md) for detailed guidelines
- License captions are managed in `libs/vre/pages/project/project/src/lib/description/license-captions-mapping.ts`

## Development Notes

### Code Style

- Self-closing tags for component selectors in templates
- no usage of ::ng-deep

### Storybook Convention

- Stories live alongside their component file as `<component>.stories.ts`
- Story titles follow the format: `Feature Area / Component / Scenario`
  - e.g. `UI / Pager / Pagination`, `Resource Editor / Property Form / Validation`
- Story export names encode acceptance criteria in plain language:
  - e.g. `ShowsErrorWhenRequiredFieldIsEmpty`, `DisablesSubmitWhileLoading`
- Use `storyName` when the export name would be awkward
- Every story must have at least one `play()` function asserting a user-visible outcome
- `argTypes` must include a `description` for every `@Input()` and `@Output()`
- Run Storybook locally: `nx run vre-ui-ui:storybook`
- Run interaction tests: `nx run vre-ui-ui:test-storybook`
- **Stories that render a real container break when its DI changes.** Some stories mount the
  actual container component (others mock it) — adding a service injection to a container breaks
  exactly those stories, not the mocked ones. When you add a dependency to a component that
  appears in stories, check which stories render it for real and stub the new providers there
  (e.g. `provideRouter([])`, service stubs).

### Internationalization

Multi-language support with translation files in:
- `apps/dsp-app/src/assets/i18n/` (de.json, en.json, fr.json, it.json)
- Romansh (`rm`) has no file; it is bound to English at runtime by the fallback loader (`apps/dsp-app/src/app/i18n-fallback-translate-loader.ts`). See DEV-6629.

## DSP-JS Client Library (Monorepo Library)

**@dasch-swiss/dsp-js** is the primary API client library for communicating with DSP-API backend. It's located at `libs/dsp-js/` and is deeply integrated throughout the application. The library is also published to NPM for external consumers.

### JSON-LD Gotchas (custom v2 endpoints)

- **Single values arrive as scalars, not arrays.** JSON-LD compaction emits
  `"prop": "value"` for one value and `"prop": ["a", "b"]` for several. A model field typed
  `string[]` must use a coercing converter — do not assume an array. Reuse the existing
  converters in `libs/dsp-js/src/models/v2/custom-converters/`
  (e.g. `UnionStringArrayOfStringsConverter`, `StringOrArrayToArrayConverter`) instead of writing
  ad-hoc checks.
- **Set the Content-Type explicitly.** Requests to custom v2 endpoints must send
  `Content-Type: application/ld+json` — Angular's `HttpClient` defaults to `application/json`,
  which dsp-api rejects for JSON-LD payloads (precedent: `ResourceLegalV2ApiService`).

## Working with APIs

**Dual-client rule — know which client carries your data.** The app talks to dsp-api through
*two* clients, and a new API field must be added to whichever one the consuming code path uses:

- Domains read through **dsp-js models** (`ReadProject`, `ReadResource`, `CreateResource`, …)
  require changes to the dsp-js models in `libs/dsp-js/` — regenerating the OpenAPI client does
  **not** surface the field there. Project data, resources, and values go through dsp-js.
- Endpoints consumed through the **generated OpenAPI client** only need
  `npm run update-openapi` after the API is deployed to dev.

If a new backend field "doesn't arrive" in the UI, check which client the reading code uses
before debugging further.
