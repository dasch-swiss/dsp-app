---
dune_map: true
schema_version: 1
last_verified_commit: fbcc79f2ee559c4cdad73bf7d715fa674aae9e61
date: 2026-09-13
---

# ARCH-MAP

## Overview

DSP-APP is the Angular browser client for the DaSCH Service Platform, built as an Nx monorepo: one application (`apps/dsp-app`) composed from 29 libraries, plus `libs/dsp-js`, which is also published to NPM. The application shell holds only bootstrap, routing and configuration; every page lives in a `libs/vre/pages/*` library, and the resource viewer/editor is its own large library. The client talks to DSP-API through two separate clients, `libs/dsp-js` (hand-written, JSON-LD, the v2 surface) and `libs/vre/3rd-party-services/open-api` (generated from a vendored spec, the admin surface); knowing which one carries a given field is the single most load-bearing fact about this codebase. Vocabulary is defined in [CONTEXT.md](CONTEXT.md), which also records where UI wording deliberately differs from code wording. Component names below are the TypeScript path aliases from `tsconfig.base.json`, because that is what import statements and the boundary lint match on; each entry also gives its Nx project name, which differs and is often surprising.

Load this file on demand for blast-radius and boundary questions. It is not meant to be read end to end.

## Components

### dsp-js

- **Nx project**: `dsp-js`
- **Paths**: `libs/dsp-js/**`
- **Purpose**: The hand-written DSP-API client covering the v2 (JSON-LD) and admin surfaces, with the domain model as decorated classes. Also published to NPM, so its public surface is a external contract, not just an internal one.
- **Key entities**: `KnoraApiConnection`, `KnoraApiConfig`, `ReadResource`, `ReadValue`, `ReadOntology`, `ResourceClassDefinition`, `ResourcePropertyDefinition`, `IHasProperty`, `Cardinality`, `Constants`, `ListNodeV2`, `ReadProject`, `ReadUser`, `PermissionUtil`, `ResourcesConversionUtil`, `OntologyConversionUtil`, `ApiResponseError`
- **Public interface**: `src/index.ts`, roughly 250 explicit named exports, no `export *`. Endpoints are reached only through `KnoraApiConnection` (`connection.v2.res`, `connection.admin.projectsEndpoint`); the endpoint classes, the caches and every converter are internal.
- **Local-context kit**: `src/models/v2/Constants.ts`, the target model file (for example `src/models/v2/resources/read/read-resource.ts`), a sibling converter in `src/models/v2/custom-converters/`, `test/data/api/v2/resources/testding.json`, `src/api/v2/resource/resources-endpoint.spec.ts`, `src/index.ts`, `src/models/v2/resources/ResourcesConversionUtil.ts`
- **Depends on**: none
- **Used by**: `dsp-app`, `vre/3rd-party-services/api`, `vre/core/config`, `vre/core/error-handler`, `vre/core/session`, `vre/pages/data-browser`, `vre/pages/ontology/list`, `vre/pages/ontology/ontology`, `vre/pages/project/project`, `vre/pages/search/advanced-search`, `vre/pages/search/search`, `vre/pages/system/system`, `vre/pages/user-settings/user`, `vre/resource-editor/resource-editor`, `vre/shared/app-common`, `vre/shared/app-common-to-move`, `vre/shared/app-helper-services`, `vre/ui/date-picker`, `vre/ui/nested-menu`, `vre/ui/string-literal`, `vre/ui/ui`
- **Boundary rules**:
  - `import 'reflect-metadata'` must stay the first line of `src/index.ts`; json2typescript decorator registration depends on it. `structure`
  - `CHANGELOG.md` and the version in `package.json` are owned by release-please. Never hand-edit. `review`
  - A `@JsonProperty` without the third `true` (optional) argument throws whenever the key is absent, because `JsonConvert` runs `DISALLOW_NULL` with `CASE_STRICT`. New fields are optional unless the server always sends them. `docs-only`
  - Adding a field here is the only way a new v2 field reaches the UI. Regenerating the OpenAPI client does not surface it. `docs-only`
- **Durable state**:
  - `KnoraApiConfig.jsonWebToken`, a public mutable field on the config object shared by every endpoint. Writers: `AuthenticationEndpointV2` login and logout, plus three writers outside this library (see `vre/core/session`). Not single-writer, and the aliasing that makes it work is undocumented.
  - `GenericCache.cache`, `shareReplay` keyed observables, evicted only by `reloadItem`. `V2Endpoint.ontologyCache` and `.listNodeCache` are deprecated; production code constructs per-request `OntologyCache` instances instead, so there is effectively no cross-request ontology cache.

### dsp-app

- **Nx project**: `dsp-app`
- **Paths**: `apps/dsp-app/**`
  - exclude: `apps/dsp-app/cypress/**`
- **Purpose**: The application shell and composition root: runtime config loading, bootstrap, the single routing table, interceptors, global providers, and all i18n and image assets. It holds no page components.
- **Key entities**: `AppComponent`, `appConfig`, `routes`, `AuthGuard`, `SysAdminGuard`, `authInterceptorFn`, `iiifWithCredentialsInterceptorFn`, `I18nFallbackTranslateLoader`, `CookieBannerComponent`, `buildTagFactory`
- **Public interface**: None. Nothing imports `@dsp-app/*`; this is a leaf consumer.
- **Local-context kit**: `src/main.ts`, `src/app/app.config.ts`, `src/app/app.routes.ts`, `libs/vre/core/config/src/lib/app-config/app-constants.ts`, `src/assets/i18n/en.json`, `src/assets/i18n/CLAUDE.md`, `project.json`
- **Depends on**: `dsp-js`, `vre/3rd-party-services/analytics`, `vre/3rd-party-services/open-api`, `vre/core/config`, `vre/core/error-handler`, `vre/core/session`, `vre/pages/ontology/list`, `vre/pages/ontology/ontology`, `vre/pages/project/project`, `vre/pages/search/advanced-search`, `vre/pages/search/search`, `vre/pages/system/system`, `vre/pages/user-settings/user`, `vre/resource-editor/resource-editor`, `vre/shared/app-help-page`, `vre/shared/app-helper-services`, `vre/ui/date-picker`, `vre/ui/ui`
- **Used by**: none
- **Boundary rules**:
  - `src/app/app.routes.ts` is the only URL surface. `RouteConstants` in `vre/core/config` supplies the strings but is not authoritative and contains entries no route uses. `docs-only`
  - Config is fetched at runtime by `src/main.ts` before `bootstrapApplication`, not compiled in. `src/environments/*` only selects which `src/config/config.<name>.json` to fetch. `structure`
  - i18n keys must exist in all four of `en/de/fr/it`. Romansh is bound to English at runtime by `src/app/i18n-fallback-translate-loader.ts` and has no file (DEV-6629). See `src/assets/i18n/CLAUDE.md`. `docs-only`
  - Project cover images are keyed by project shortcode at `src/assets/images/project/width-500/{shortcode}.webp`. See that directory's `CLAUDE.md`. `docs-only`
- **Durable state**:
  - `localStorage['cookieBanner']`, written by `src/app/cookie-banner.component.ts`. The only localStorage key this component owns; the other five are owned by libraries.
  - `window.Sentry`, set in `src/main.ts`.

### dsp-app-e2e

- **Nx project**: none
- **Paths**: `apps/dsp-app/cypress/**`
- **Purpose**: The Cypress end-to-end suite: 20 specs across `logged-out-user`, `project-member`, `system-admin` and `performance`. It is recorded as its own component rather than folded into `dsp-app` because it is built and checked by a different toolchain from everything else in the repository.
- **Key entities**: `projectPage`, `ontology-command`, `file-uploader`
- **Public interface**: None.
- **Local-context kit**: `apps/dsp-app/cypress.config.ts`, `apps/dsp-app/cypress/tsconfig.json`, `cypress/support/commands.ts`, `cypress/support/pages/project-page.ts`, `.github/workflows/ci.yml` (the `dsp-app-e2e-tests` job)
- **Depends on**: `dsp-js` and the generated OpenAPI client, both by relative path rather than by alias. Two of those paths no longer exist; see the boundary rules.
- **Used by**: none
- **Boundary rules**:
  - Run by `.github/workflows/ci.yml`, job `dsp-app-e2e-tests`, as a two-runner matrix (`heavy` and `light`) invoking `npx cypress run` directly. There is no Nx `e2e` target. `static-analysis`
  - The matrix mixes two styles: `project-member`, `logged-out-user` and `performance` are globbed, while all ten `system-admin` specs are enumerated one by one. All 20 specs are covered today, but a new `system-admin` spec will not run until the matrix is edited, and nothing reports that omission. `docs-only`
  - `dsp-app-e2e-tests-status` is the required gate that aggregates the matrix. `static-analysis`
  - **Nothing type-checks this subtree.** `apps/dsp-app/cypress/tsconfig.json` exists but no target runs `tsc` against it, and `eslint.config.mjs:173` excludes the directory. Cypress bundles specs transpile-only, so a broken type-only import is erased before runtime and the suite stays green. Five files currently import from `libs/vre/open-api/src` and `libs/vre/shared/app-representations/src`, neither of which exists. `docs-only`
  - Do not copy its import style. It bypasses the `@dasch-swiss/*` aliases because the boundary lint is disabled here. `docs-only`
- **Durable state**: `cypress.config.ts` carries a hardcoded JWT literal in `env.authToken`, alongside localhost URLs for api, ingest and IIIF. It is a local-stack fixture, not a credential for a deployed environment.

### vre/3rd-party-services/api

- **Nx project**: `vre-shared-app-api`
- **Paths**: `libs/vre/3rd-party-services/api/**`
- **Purpose**: Hand-written Angular services over DSP-API REST endpoints, plus hand-written TypeScript interfaces for v2 ontology JSON-LD payloads.
- **Key entities**: `BaseApi`, `ProjectApiService`, `UserApiService`, `ListApiService`, `LegalInfoApiService`, `OntologyV2ApiService`, `ResourceLegalV2ApiService`, `ProjectIdentifier`
- **Public interface**: Six `export *` from `src/index.ts`. `BaseApi` and `AuthenticationApiService` are internal.
- **Local-context kit**: `src/index.ts`, `src/lib/services/base-api.ts`, `src/lib/admin/project-api.service.ts`, `src/lib/admin/legal-info-api.service.ts`, `src/lib/v2/resource-legal-v2-api.service.ts`, `src/lib/v2/ontology/ontology-v2-api.service.ts`, `CLAUDE.md` (the dual-client rule)
- **Depends on**: `dsp-js`, `vre/3rd-party-services/open-api`, `vre/core/config`
- **Used by**: `vre/core/session`, `vre/pages/ontology/list`, `vre/pages/ontology/ontology`, `vre/pages/project/project`, `vre/pages/system/system`, `vre/pages/user-settings/user`, `vre/resource-editor/resource-editor`, `vre/shared/app-common-to-move`, `vre/shared/app-helper-services`
- **Boundary rules**:
  - Every service that calls DSP-API over HTTP belongs here, never inline in a component and never in `shared/`. `docs-only`
  - Requests to custom v2 endpoints must set `Content-Type: application/ld+json` explicitly. Angular's `HttpClient` defaults to `application/json`, which dsp-api rejects. Precedent: `ResourceLegalV2ApiService`. `docs-only`
  - A new service extends `BaseApi` and is added to `src/index.ts` by hand. `docs-only`
  - `ProjectApiService`, `UserApiService` and `ListApiService` call `HttpClient` directly against admin endpoints the generated client already covers, and return dsp-js models. `LegalInfoApiService`, in the same directory, wraps the generated client instead. Both conventions live here with nothing distinguishing them. `docs-only`
- **Durable state**: none. `BaseApi.baseUri` is computed once per service at construction.

### vre/3rd-party-services/open-api

- **Nx project**: `vre-open-api`
- **Paths**: `libs/vre/3rd-party-services/open-api/**`
- **Purpose**: The vendored DSP-API OpenAPI spec plus the generator config that produces a typed Angular client at install time. The only hand-written source is one string-literal type guard.
- **Key entities**: `AdminAPIApiService`, `APIV2ApiService`, `APIV3ApiService`, `SegmentApiService`, `StringLiteralV2`, `ProjectLicenseDto`, `ensureWithDefaultLanguage`, `StringLiteralWithLanguage`
- **Public interface**: `export * from './generated/index'` and `export * from './lib/type-guards'`.
- **Local-context kit**: `README.md`, `openapitools.json`, `dsp-api_spec.yaml` (head only), `src/index.ts`, `src/lib/type-guards.ts`, `.claude/skills/update-openapi-client/SKILL.md`, `scripts/check-openapi-sync.sh`
- **Depends on**: none
- **Used by**: `dsp-app`, `vre/3rd-party-services/api`, `vre/pages/data-browser`, `vre/pages/ontology/list`, `vre/pages/ontology/ontology`, `vre/pages/project/project`, `vre/pages/system/system`, `vre/resource-editor/resource-editor`, `vre/shared/app-helper-services`, `vre/ui/string-literal`
- **Boundary rules**:
  - `src/generated/**` is gitignored and deleted by `rm -rf` on every generate. Edits there cannot be committed and cannot survive. `structure`
  - Never edit `dsp-api_spec.yaml` to silence `check-openapi-sync`. A red check is expected until the dsp-api change is deployed to dev. Use the `update-openapi-client` skill. `review`
  - You do not add code here. Bump the spec and regenerate. `docs-only`
- **Durable state**: `dsp-api_spec.yaml`, currently pinned at `info.version: v38.1.0-5-g35a36e3`. Written by `npm run update-openapi` or by the CI auto-bump PR.

### vre/3rd-party-services/analytics

- **Nx project**: `vre-3rd-party-services-analytics`
- **Paths**: `libs/vre/3rd-party-services/analytics/**`
- **Purpose**: Lazy-loads and wraps the Grafana Faro Web SDK for real-user monitoring, tracing, custom events and pseudonymised user identification.
- **Key entities**: `GrafanaFaroService`, `setup`, `trackEvent`, `trackError`, `setUser`, `removeUser`
- **Public interface**: `GrafanaFaroService` only.
- **Local-context kit**: `src/lib/grafana-faro.service.ts`, `src/lib/grafana-faro.service.spec.ts`, `apps/dsp-app/src/app/app.config.ts`, `libs/vre/core/config/src/lib/app-config/dsp-instrumentation-config.ts`, `libs/vre/core/error-handler/src/lib/error-reporting.service.ts`
- **Depends on**: `vre/core/config`
- **Used by**: `dsp-app`, `vre/core/session`
- **Boundary rules**:
  - Every Faro import must stay inside the dynamic `Promise.all` in `setup()`. The SDK is roughly 300 KB and must not enter the main bundle. `docs-only`
  - Every public method is try/catch wrapped so telemetry can never break the app. Keep that. `docs-only`
  - User identifiers are hashed with UUID v5 before being sent. Never send a raw user IRI. `review`
- **Durable state**: `window.__FARO__`, a mutable global written here in `setup()` and read by `ErrorReportingService` in `vre/core/error-handler`. One writer, one cross-library reader, no DI token.

### vre/core/config

- **Nx project**: `vre-core-config`
- **Paths**: `libs/vre/core/config/**`
- **Purpose**: Parses and validates the runtime config file into typed objects, and holds the application's DI tokens. In practice it also holds the routing vocabulary and a set of unrelated global constants; see the note below.
- **Key entities**: `AppConfigService`, `AppConfigToken`, `DspApiConfigToken`, `DspApiConnectionToken`, `RouteConstants`, `ApiConstants`, `Auth`, `AvailableLanguages`, `LocalStorageLanguageKey`, `DspDialogConfig`, `buildTagFactory`
- **Public interface**: 11 re-exports from `src/index.ts`. `dsp-feature-config` and `dsp-ingest-config` are not exported but their types leak through `AppConfigService` getters.
- **Local-context kit**: `src/index.ts`, `src/lib/app-config/app-config.ts`, `src/lib/app-config/app-config.service.ts`, `src/lib/app-config/dsp-api-tokens.ts`, `src/lib/app-config/app-constants.ts`, `apps/dsp-app/src/app/app.config.ts`, `apps/dsp-app/src/main.ts`
- **Depends on**: `dsp-js`
- **Used by**: `dsp-app`, `vre/3rd-party-services/analytics`, `vre/3rd-party-services/api`, `vre/core/error-handler`, `vre/core/session`, `vre/pages/data-browser`, `vre/pages/ontology/list`, `vre/pages/ontology/ontology`, `vre/pages/project/project`, `vre/pages/search/advanced-search`, `vre/pages/search/search`, `vre/pages/system/system`, `vre/pages/user-settings/user`, `vre/resource-editor/resource-editor`, `vre/shared/app-common`, `vre/shared/app-common-to-move`, `vre/shared/app-help-page`, `vre/shared/app-helper-services`, `vre/ui/string-literal`
- **Boundary rules**:
  - This library holds five unrelated concerns: config parsing, dsp-js DI tokens, `RouteConstants`, an assorted-constants drawer, and build-tag fetching. Its fan-in of 19 is driven mainly by `RouteConstants`, not by config. Splitting the routing vocabulary into its own zero-dependency library is what would actually reduce coupling. `docs-only`
  - `DspApiConnectionToken` is declared here but provided from `vre/pages/user-settings/user`, so the application's root injector cannot boot without loading a page library. `docs-only`
  - `AppConfigService` getters hand out mutable objects. `dspApiConfig` in particular is the live JWT holder. `docs-only`
- **Durable state**: `AppConfigService._dspApiConfig`, the shared dsp-js `KnoraApiConfig`. Five writers across four libraries. See `vre/core/session`.

### vre/core/session

- **Nx project**: `vre-core-session`
- **Paths**: `libs/vre/core/session/**`
- **Purpose**: Owns the JWT lifecycle: storage, expiry checking, login and logout orchestration, auto-login at boot, and the current-user stream.
- **Key entities**: `AccessTokenService`, `AuthService`, `AutoLoginService`, `LocalStorageWatcherService`, `UserService`, `hasCheckedCredentials$`, `afterSuccessfulLogin$`, `isSysAdmin$`, `AuthError`
- **Public interface**: Named exports from `src/index.ts`. `Session` and `CurrentUser` are exported but have no consumers.
- **Local-context kit**: `src/lib/access-token.service.ts`, `src/lib/auth.service.ts`, `src/lib/auto-login.service.ts`, `src/lib/user.service.ts`, `apps/dsp-app/src/app/main/http-interceptors/auth.interceptor.fn.ts`, `libs/vre/pages/user-settings/user/src/lib/account/api-connection-token.provider.ts`, `apps/dsp-app/src/app/app.component.ts`
- **Depends on**: `dsp-js`, `vre/3rd-party-services/analytics`, `vre/3rd-party-services/api`, `vre/core/config`, `vre/core/error-handler`, `vre/shared/app-common`, `vre/shared/app-helper-services`
- **Used by**: `dsp-app`, `vre/pages/data-browser`, `vre/pages/ontology/ontology`, `vre/pages/project/project`, `vre/pages/search/advanced-search`, `vre/pages/system/system`, `vre/pages/user-settings/user`, `vre/resource-editor/resource-editor`, `vre/shared/app-common-to-move`
- **Boundary rules**:
  - Anything touching the token goes through `AccessTokenService`; anything touching the current user goes through `UserService`. Two places currently bypass this: `apiConnectionTokenProvider` reads raw localStorage, and `LocalStorageWatcherService` hardcodes the string `'ACCESS_TOKEN'` instead of `Auth.AccessToken`. `docs-only`
  - Token expiry is checked only at boot. There is no 401 handling anywhere in the application. `docs-only`
- **Durable state**:
  - `localStorage['ACCESS_TOKEN']`. Intended single writer is `AccessTokenService`, called by `AuthService` on login and logout and by `AutoLoginService` when a stored token is expired.
  - The same JWT is mirrored in three places kept in sync by hand: localStorage, `KnoraApiConfig.jsonWebToken`, and `UserService._user$`. Correctness depends on an undocumented shared-object-identity invariant with no test covering it.
  - `AutoLoginService.hasCheckedCredentials$`, a root BehaviorSubject gating all three route guards.

### vre/core/error-handler

- **Nx project**: `vre-core-error-handler`
- **Paths**: `libs/vre/core/error-handler/**`
- **Purpose**: The global Angular `ErrorHandler`. Turns dsp-api, dsp-js and HTTP failures into user-facing snackbars and, separately, into Sentry and Faro telemetry.
- **Key entities**: `AppErrorHandler`, `provideAppErrorHandler`, `ErrorReportingService`, `reasonFromErrorBody`, `declaredMessageOf`, `AppError`, `UserFeedbackError`, `JsLibParsedError`, `DEDUP_WINDOW_MS`
- **Public interface**: The nine symbols above, from `src/index.ts`.
- **Local-context kit**: `src/lib/app-error-handler.ts`, `src/lib/api-error-reason.ts`, `src/lib/error-reporting.service.ts`, `src/lib/app-error-handler.providers.ts`, `src/lib/app-error-handler.spec.ts`, `apps/dsp-app/src/assets/i18n/en.json`, `libs/vre/3rd-party-services/analytics/src/lib/grafana-faro.service.ts`
- **Depends on**: `dsp-js`, `vre/core/config`, `vre/ui/notification`
- **Used by**: `dsp-app`, `vre/core/session`, `vre/pages/project/project`, `vre/pages/search/advanced-search`, `vre/pages/search/search`, `vre/pages/system/system`, `vre/resource-editor/resource-editor`
- **Boundary rules**:
  - `provideAppErrorHandler` uses `useExisting` with no `deps` array deliberately. A hand-written `deps` list once passed `undefined` and silently disabled every snackbar in the application (DEV-6872). The docblock is the record; do not "fix" it. `docs-only`
  - Branch ordering in `handleGenericError` is load-bearing: specific cases must precede generic ones, and the `status === 0` comment explains why. `docs-only`
  - The dense inline docblocks citing DEV ticket numbers are the documentation of record for this library. `docs-only`
- **Durable state**: `ErrorReportingService._reportedAt`, a per-tab fingerprint-to-timestamp map implementing a 60 second dedup window. Single writer, never evicted, so it grows unbounded over a long session.

### vre/ui/ui

- **Nx project**: `vre-ui-ui`
- **Paths**: `libs/vre/ui/ui/**`
- **Purpose**: The shared component kit: dialogs, form controls, layout primitives, pipes and directives. It also carries a tail of page-shaped and domain-specific components that do not belong in a kit.
- **Key entities**: `DialogService`, `ConfirmDialogComponent`, `DialogHeaderComponent`, `CkEditorComponent`, `CommonInputComponent`, `ChipListInputComponent`, `TimeInputComponent`, `PagerComponent`, `KnoraDatePipe`, `HumanReadableErrorPipe`, `AdminImageDirective`, `NotAllowedPageComponent`, `NoResultsFoundPageComponent`, `ResourceRightsStatementComponent`, `UiStandaloneComponents`
- **Public interface**: 46 re-exports from `src/index.ts`, plus the `UiStandaloneComponents` array in `src/ui.components.ts`.
- **Local-context kit**: `src/index.ts`, `src/ui.components.ts`, `src/lib/dialog/dialog.service.ts`, `src/lib/dialog/confirm-dialog.component.ts`, `src/lib/common-input.component.ts`, `src/lib/pipes/formatting/knoradate.pipe.ts`, `src/lib/search-failed.component.ts`
- **Depends on**: `dsp-js`, `vre/shared/app-common`, `vre/ui/date-picker`
- **Used by**: `dsp-app`, `vre/pages/data-browser`, `vre/pages/ontology/list`, `vre/pages/ontology/ontology`, `vre/pages/project/project`, `vre/pages/search/advanced-search`, `vre/pages/search/search`, `vre/pages/system/system`, `vre/pages/user-settings/user`, `vre/resource-editor/resource-editor`, `vre/shared/app-common-to-move`, `vre/ui/string-literal`
- **Boundary rules**:
  - `UiStandaloneComponents` has no consumers anywhere. The single import it forces is the only reason the `ui/ui` to `ui/date-picker` edge exists. `docs-only`
  - `NotAllowedPageComponent` and `NoResultsFoundPageComponent` are mounted as routes at `/403` and `/404`. Routed pages in a component kit are an exception, not a pattern to copy. `docs-only`
  - `ResourceRightsStatementComponent`, `AuthorshipChipEditorComponent`, `AdminImageDirective` and `KnoraDatePipe` carry DSP domain knowledge and are kit members only by location. `docs-only`
- **Durable state**: none. `DialogService` is a stateless wrapper over `MatDialog`.

### vre/ui/date-picker

- **Nx project**: `vre-ui-date-picker`
- **Paths**: `libs/vre/ui/date-picker/**`
- **Purpose**: The adapter layer binding DSP's `KnoraDate` and the `shared/calendar` `CalendarDate` model onto Angular Material's datepicker. It carries translation logic, not calendar arithmetic.
- **Key entities**: `AppDatePickerComponent`, `DateValueHandlerComponent`, `CalendarDateAdapter`, `CALENDAR_DATE_FORMATS`, `provideCalendarDateAdapter`, `knoraDateToCalendarDate`, `calendarDateToKnoraDate`, `ValueService`
- **Public interface**: Components, adapters, `provideCalendarDateAdapter()` and validators, from `src/index.ts`.
- **Local-context kit**: `src/index.ts`, `src/lib/adapters/knora-date.adapter.ts`, `src/lib/adapters/calendar-date.adapter.ts`, `src/lib/adapters/calendar-date-adapter.providers.ts`, `src/lib/date-value-handler/value.service.ts`, `src/lib/validators/date.validators.ts`, `apps/dsp-app/src/app/app.config.ts`
- **Depends on**: `dsp-js`, `vre/shared/calendar`
- **Used by**: `dsp-app`, `vre/pages/search/advanced-search`, `vre/resource-editor/resource-editor`, `vre/ui/ui`
- **Boundary rules**:
  - Two live `KnoraDate` to `CalendarDate` converters disagree. `src/lib/adapters/knora-date.adapter.ts` negates the year for BCE; `src/lib/date-value-handler/value.service.ts` applies the astronomical-year conversion. They differ by one year for BCE dates and both are reachable. `ValueService` is the legacy path. `docs-only`
  - Era vocabulary differs between layers: dsp-js uses `AD` and `noEra`, `shared/calendar` uses `CE` and `NONE`. The normalisation lives in `knora-date.adapter.ts`. `docs-only`
- **Durable state**: `provideCalendarDateAdapter()` replaces Angular Material's root `DateAdapter` and `MAT_DATE_FORMATS` application-wide at `apps/dsp-app/src/app/app.config.ts`. Single writer, but every Material datepicker in the application is affected.

### vre/ui/string-literal

- **Nx project**: `vre-library-app-string-literal`
- **Paths**: `libs/vre/ui/string-literal/**`
- **Purpose**: Multi-language form inputs for `StringLiteral` values, and the pipe that renders one in the current UI language.
- **Key entities**: `MultiLanguageInputComponent`, `MultiLanguageTextareaComponent`, `StringifyStringLiteralPipe`, `MultiLanguageFormService`, `MultiLanguageFormArray`, `DEFAULT_MULTILANGUAGE_FORM`
- **Public interface**: `src/index.ts` plus the `StringLiteralComponents` array, which has no consumers.
- **Local-context kit**: `src/index.ts`, `src/lib/stringify-string-literal.pipe.ts`, `src/lib/multi-language-form.service.ts`, `src/lib/multi-language-input.component.ts`, `src/lib/multilanguage-form.type.ts`, `src/lib/default-multi-language-form.ts`, `libs/vre/shared/app-helper-services/src/lib/localization.service.ts`
- **Depends on**: `dsp-js`, `vre/3rd-party-services/open-api`, `vre/core/config`, `vre/shared/app-helper-services`, `vre/ui/ui`
- **Used by**: `vre/pages/data-browser`, `vre/pages/ontology/list`, `vre/pages/ontology/ontology`, `vre/pages/project/project`, `vre/pages/search/advanced-search`, `vre/resource-editor/resource-editor`, `vre/ui/nested-menu`
- **Boundary rules**:
  - This is the one genuine and hard to remove exception to the UI tier being presentational. `StringifyStringLiteralPipe` is declared `pure: false` specifically so it re-renders when `LocalizationService.currentLanguage` changes, and its docblock names that service as the single gate-keeper of the current language. Removing the dependency means threading language through every call site as an input. `docs-only`
  - Never call `TranslateService.use()` here. Go through `LocalizationService`. `docs-only`
  - `StringLiteral` (dsp-js), `StringLiteralV2` (dsp-js v2), `LanguageStringDto` and `StringLiteralWithLanguage` (open-api) are four shapes of one concept, all accepted by this pipe's input union. `docs-only`
- **Durable state**: none of its own. `MultiLanguageFormService` is component-scoped. The pipe holds per-instance memo fields.

### vre/ui/progress-indicator

- **Nx project**: `vre-ui-progress-indicator`
- **Paths**: `libs/vre/ui/progress-indicator/**`
- **Purpose**: Spinner and loading-overlay widgets, plus a directive that places a spinner inside a button.
- **Key entities**: `AppProgressIndicatorComponent`, `ProgressIndicatorOverlayComponent`, `ProgressSpinnerComponent`, `LoadingButtonDirective`
- **Public interface**: `src/index.ts` plus the `ProgressIndicatorComponents` array, which has no consumers.
- **Local-context kit**: `src/index.ts`, `src/progress-indicator.components.ts`, `src/lib/app-progress-indicator/app-progress-indicator.component.ts`, `src/lib/app-progress-indicator/progress-indicator-overlay.component.ts`, `src/lib/loading-button/loading-button.directive.ts`
- **Depends on**: none
- **Used by**: `vre/pages/data-browser`, `vre/pages/ontology/list`, `vre/pages/ontology/ontology`, `vre/pages/project/project`, `vre/pages/search/advanced-search`, `vre/pages/search/search`, `vre/pages/system/system`, `vre/pages/user-settings/user`, `vre/resource-editor/resource-editor`, `vre/shared/app-common-to-move`
- **Boundary rules**: One of two libraries in the repository with zero internal dependencies at runtime. Keep it that way. `docs-only`
- **Durable state**: none.

### vre/ui/nested-menu

- **Nx project**: `vre-ui-nested-menu`
- **Paths**: `libs/vre/ui/nested-menu/**`
- **Purpose**: A recursive Material menu for picking a node out of a controlled vocabulary.
- **Key entities**: `NestedMenuComponent`, `selectMenuWithChildren`, `openSubMenu`
- **Public interface**: `NestedMenuComponent` only.
- **Local-context kit**: `src/index.ts`, `src/lib/nested-menu.component.ts`, `src/lib/nested-menu.component.stories.ts`, `libs/vre/ui/string-literal/src/lib/stringify-string-literal.pipe.ts`
- **Depends on**: `dsp-js`, `vre/ui/string-literal`
- **Used by**: `vre/pages/search/advanced-search`, `vre/resource-editor/resource-editor`
- **Boundary rules**: Fully input and output driven, no injected services. Its apparent dependencies on `core/config` and `shared/app-helper-services` exist only in its Storybook file. `docs-only`
- **Durable state**: none.

### vre/ui/notification

- **Nx project**: `vre-ui-notification`
- **Paths**: `libs/vre/ui/notification/**`
- **Purpose**: A one-method wrapper over `MatSnackBar` for success and error toasts. It contains a service, not a UI component, and sits under the `ui/` tier by name only.
- **Key entities**: `NotificationService`, `openSnackBar`
- **Public interface**: `NotificationService` only.
- **Local-context kit**: `src/index.ts`, `src/lib/app-notification/app-notification.service.ts`, `project.json`
- **Depends on**: none
- **Used by**: `vre/core/error-handler`, `vre/pages/ontology/ontology`, `vre/pages/project/project`, `vre/pages/system/system`, `vre/pages/user-settings/user`, `vre/resource-editor/resource-editor`, `vre/shared/app-common-to-move`
- **Boundary rules**: `vre/core/error-handler` depends on this library, so the dependency runs from `core` into `ui`. That inversion is why "core never imports ui" cannot be stated as a rule today. `docs-only`
- **Durable state**: none. State lives in Material's overlay.

### vre/shared/app-common

- **Nx project**: `vre-shared-app-common`
- **Paths**: `libs/vre/shared/app-common/**`
- **Purpose**: Framework-level utilities shared by everything: regex, validators, RxJS operators, IRI helpers. Roughly half of it is actually resource-editor domain model.
- **Key entities**: `ResourceService`, `DspResource`, `DspCompoundPosition`, `CustomRegex`, `GenerateProperty`, `generateDspResource`, `UserPermissions`, `PropertyInfoValues`, `PLACEHOLDER_SENTINEL`, `fulltextSearchTermValidator`, `filterNull`, `listRootIriFromGuiAttributes`, `triggerBlobDownload`
- **Public interface**: 17 `export *` lines from `src/index.ts`.
- **Local-context kit**: `src/index.ts`, `src/lib/dsp-resource.ts`, `src/lib/resource.service.ts`, `src/lib/legal/placeholder-sentinel.ts`, `src/lib/form-validators/search-term.validator.ts`, `project.json`, `README.md`
- **Depends on**: `dsp-js`, `vre/core/config`
- **Used by**: `vre/core/session`, `vre/pages/data-browser`, `vre/pages/ontology/list`, `vre/pages/ontology/ontology`, `vre/pages/project/project`, `vre/pages/search/advanced-search`, `vre/pages/search/search`, `vre/pages/system/system`, `vre/resource-editor/resource-editor`, `vre/shared/app-common-to-move`, `vre/shared/app-helper-services`, `vre/ui/ui`
- **Boundary rules**: `dsp-resource.ts`, `generateProperty.ts`, `generate-dsp-resource.ts`, `property-info-values.interface.ts`, `user-permissions.ts` and `list-gui-attributes.ts` are resource-editor and ontology domain models, not generic utilities. This is an early stage of the same drift that produced `app-helper-services`. `docs-only`
- **Durable state**: none. `ResourceService.iriBase` is computed once at construction.

### vre/shared/app-common-to-move

- **Nx project**: `vre-shared-app-common-to-move`
- **Paths**: `libs/vre/shared/app-common-to-move/**`
- **Purpose**: The application shell chrome (the header bar and its sub-components) plus the auth and user form widgets. Despite the name it is not a staging area; it is a feature and shell library mis-filed under `shared/`.
- **Key entities**: `HeaderComponent`, `HeaderLogoComponent`, `HeaderUserActionsComponent`, `GlobalSearchComponent`, `LanguageSwitcherComponent`, `UserMenuComponent`, `LoginFormComponent`, `PasswordFormFieldComponent`, `PasswordConfirmFormComponent`, `SearchTipsComponent`, `UserFormComponent`, `SplitPipe`
- **Public interface**: 14 exports from `src/index.ts`.
- **Local-context kit**: `src/index.ts`, `src/lib/header/header.component.ts`, `src/lib/header/header-user-actions.component.ts`, `src/lib/header/language-switcher.component.ts`, `src/lib/header/login-form/login-form.component.ts`, `src/lib/user-form/user-form.component.ts`, `src/lib/user-form/user-form.type.ts`
- **Depends on**: `dsp-js`, `vre/3rd-party-services/api`, `vre/core/config`, `vre/core/session`, `vre/shared/app-common`, `vre/shared/app-helper-services`, `vre/ui/notification`, `vre/ui/progress-indicator`, `vre/ui/ui`
- **Used by**: `vre/pages/ontology/ontology`, `vre/pages/project/project`, `vre/pages/search/advanced-search`, `vre/pages/search/search`, `vre/pages/system/system`, `vre/pages/user-settings/user`
- **Boundary rules**:
  - Its fan-out of 9 exceeds its fan-in of 6, which is backwards for a shared library and is the diagnostic that it is not one. Shared libraries are leaves.
  - No record exists anywhere of an intended destination. The name has been unexplained since the library was created in May 2024 as the residue of an unrelated refactor. Items have left it over time, so the mechanism works; what remains is the app shell, which is hard to move because it requires deciding where the shell lives. `docs-only`
  - Do not add to it. `docs-only`
- **Durable state**: none of its own, but `src/lib/header/language-switcher.component.ts` writes `LocalizationService.currentLanguage`, which is owned by `vre/shared/app-helper-services`. That value has three writers across three libraries.

### vre/shared/app-helper-services

- **Nx project**: `app-helper-services`
- **Paths**: `libs/vre/shared/app-helper-services/**`
- **Purpose**: Nominally a set of root-scoped helper services. In practice it holds four different kinds of thing: the ontology-editor property-type registry, application-wide i18n infrastructure, a stateful cache with a security contract, and page-scoped view state.
- **Key entities**: `DefaultProperties`, `DefaultProperty`, `PropertyCategory`, `DefaultResourceClasses`, `OntologyService`, `getDefaultProperty`, `ProjectService`, `IriToUuid`, `uuidToIri`, `LocalizationService`, `ProjectDataRightsService`, `ResourceResultService`, `SortingHelper`, `pickPreferredLanguageString`
- **Public interface**: 9 exports from `src/index.ts`, plus a declared secondary entry point `@dasch-swiss/vre/shared/app-helper-services/testing` mapping to `src/testing.ts`.
- **Local-context kit**: `src/index.ts`, `src/testing.ts`, `src/lib/default-data/default-properties.ts`, `src/lib/ontology.service.ts`, `src/lib/localization.service.ts`, `src/lib/project-data-rights.service.ts`, `src/lib/resource-result.service.ts`
- **Depends on**: `dsp-js`, `vre/3rd-party-services/api`, `vre/3rd-party-services/open-api`, `vre/core/config`, `vre/shared/app-common`
- **Used by**: `dsp-app`, `vre/core/session`, `vre/pages/data-browser`, `vre/pages/ontology/list`, `vre/pages/ontology/ontology`, `vre/pages/project/project`, `vre/pages/search/advanced-search`, `vre/pages/search/search`, `vre/pages/system/system`, `vre/pages/user-settings/user`, `vre/resource-editor/resource-editor`, `vre/shared/app-common-to-move`, `vre/ui/string-literal`
- **Boundary rules**:
  - `default-properties.ts`, `default-resource-classes.ts` and `ontology.service.ts` are ontology-editor domain data. Every consumer is `vre/pages/ontology/ontology`. Adding a property type means editing this library, not the ontology library. `docs-only`
  - `getDefaultProperty` is a triple-nested linear scan whose match key varies across five branches. The mapping is not injective: `IntValue` appears twice in the table, so resolution depends on both the declaration order of the categories and the order of `subPropertyOf` as the API returns it. Neither is pinned. `docs-only`
  - `LocalizationService` is the only permitted writer of the UI language. Never call `TranslateService.use()` directly. `docs-only`
  - `ProjectDataRightsService` documents a security invariant: cross-user isolation depends on `AuthService.logout()` performing a full page reload. `review`
- **Durable state**:
  - `LocalizationService._currentLanguage$` plus `localStorage['dsp_language']` plus `document.documentElement.lang`. Three writers: `LocalizationService.init()`, `LanguageSwitcherComponent` in `app-common-to-move`, and `AuthService` in `core/session`.
  - `ProjectDataRightsService`, a root-scoped cache with a reverse shortcode index. Written by its own mutation methods and externally by `ProjectPageGuard` calling `clearAll()`.
  - `ResourceResultService`, component-scoped paging state. `numberOfResults` is a plain public field written from six sites across three libraries with no change notification; `pageIndex` is a BehaviorSubject behind a method. See Cross-cutting concerns.

### vre/shared/app-help-page

- **Nx project**: `vre-shared-app-help-page`
- **Paths**: `libs/vre/shared/app-help-page/**`
- **Purpose**: The static `/help` route: a grid of documentation and support links, an application and API version panel, and the application footer.
- **Key entities**: `HelpPageComponent`, `FooterComponent`, `GridComponent`, `GridItem`, `releaseNotesUrl`
- **Public interface**: Three components from `src/index.ts`.
- **Local-context kit**: `src/index.ts`, `src/lib/help-page/help-page.component.ts`, `src/lib/help-page/help-page.component.html`, `src/lib/grid/grid.component.ts`, `src/lib/footer/footer.component.ts`, `src/lib/i18n.spec-helper.ts`, `README.md`
- **Depends on**: `vre/core/config`
- **Used by**: `dsp-app`, `vre/pages/user-settings/user`
- **Boundary rules**: `src/lib/help-page/help-page.component.ts` carries the only `@nx/enforce-module-boundaries` suppression in the repository, for a seven-level relative import of the root `package.json`. `static-analysis`
- **Durable state**: none.

### vre/shared/calendar

- **Nx project**: `calendar`
- **Paths**: `libs/vre/shared/calendar/**`
- **Purpose**: A framework-free multi-calendar date library (Gregorian, Julian, Islamic) using the Julian Day Number as the conversion pivot, with comparison and period validation.
- **Key entities**: `CalendarSystem`, `CALENDAR_SYSTEMS`, `Era`, `ERAS`, `DatePrecision`, `CalendarDate`, `CalendarPeriod`, `CalendarOperations`, `CalendarError`, `createDate`, `convertCalendar`, `compareDates`, `validatePeriod`, `GregorianCalendar`, `JulianCalendar`, `IslamicCalendar`, `getCalendar`
- **Public interface**: The only hand-curated barrel in the repository: named `export` and `export type` blocks with a `@packageDocumentation` usage example, no `export *`.
- **Local-context kit**: `src/index.ts`, `src/lib/types/calendar.types.ts`, `src/lib/factories/calendar.factory.ts`, `src/lib/factories/date.factory.ts`, `src/lib/converters/calendar.converter.ts`, `src/lib/calendars/gregorian.calendar.ts`, `README.md`
- **Depends on**: none
- **Used by**: `vre/ui/date-picker`
- **Boundary rules**:
  - Zero `@dasch-swiss` imports, no Angular DI, pure functions and immutable value objects. This is the reference example in the repository for how a library should be shaped. `structure`
  - It is the only library with its own `package.json` and a real `build` target, and the only one with one spec per implementation file. `docs-only`
- **Durable state**: none.

### vre/shared/assets/status-msg

- **Nx project**: `vre-shared-assets-status-msg`
- **Paths**: `libs/vre/shared/assets/status-msg/**`
- **Purpose**: A lookup table of HTTP status codes to human-readable messages. It has no consumers anywhere in the repository and is dead.
- **Key entities**: `HttpStatusMsg`
- **Public interface**: `HttpStatusMsg`, imported by nothing.
- **Local-context kit**: `src/index.ts`, `src/lib/status-msg/statusMsg.ts`, `project.json`, `README.md`. That is the whole library.
- **Depends on**: none
- **Used by**: none
- **Boundary rules**: Dead. The last substantive edit to its only source file was December 2023, and that commit was a repository-wide reformat. Removing the library also requires deleting its alias from `tsconfig.base.json`, which is the only thing keeping it addressable. `docs-only`
- **Durable state**: `HttpStatusMsg.default`, typed `any`, on a root singleton. No writers, because there are no consumers.

### vre/pages/project/project

- **Nx project**: `vre-pages-project-project`
- **Paths**: `libs/vre/pages/project/project/**`
- **Purpose**: The project area: the project shell and its navigation, the data browser page, collaboration and all project settings (image, legal, resource metadata, view restrictions), and the project create and edit forms.
- **Key entities**: `ProjectPageService`, `DataBrowserPageService`, `ProjectPageGuard`, `ProjectAdminGuard`, `CollaborationPageService`, `ViewRestrictionsPageService`, `ResourceClassSidenavComponent`, `ResourcesListFetcherComponent`, `ReusableProjectFormComponent`, `LicenseCaptionsMapping`, `shortcode-exists.validator`
- **Public interface**: 19 `export *` from `src/index.ts`, but only the routed components, two services and two guards are consumed elsewhere. In practice the outside world imports one symbol: `ProjectPageService`.
- **Local-context kit**: `src/index.ts`, `src/lib/project-page.service.ts`, `src/lib/project-page.guard.ts`, `src/lib/data-browser-page.component.ts`, `src/lib/project-settings/view-restrictions/view-restrictions-page.service.ts`, `src/lib/stories.helpers.ts`, `apps/dsp-app/src/app/app.routes.ts`
- **Depends on**: `dsp-js`, `vre/3rd-party-services/api`, `vre/3rd-party-services/open-api`, `vre/core/config`, `vre/core/error-handler`, `vre/core/session`, `vre/pages/data-browser`, `vre/pages/system/system`, `vre/pages/user-settings/user`, `vre/resource-editor/resource-editor`, `vre/shared/app-common`, `vre/shared/app-common-to-move`, `vre/shared/app-helper-services`, `vre/ui/notification`, `vre/ui/progress-indicator`, `vre/ui/string-literal`, `vre/ui/ui`
- **Used by**: `dsp-app`, `vre/pages/ontology/list`, `vre/pages/ontology/ontology`, `vre/pages/search/advanced-search`, `vre/pages/search/search`
- **Boundary rules**:
  - Page-level state is a component-provided service listed in `providers:`, not a root singleton. `docs-only`
  - A project identifier is a UUID in routes and an IRI in services. `ProjectService.IriToUuid` and `uuidToIri` are the only permitted conversion. `docs-only`
  - License captions are managed in `src/lib/description/license-captions-mapping.ts`. `docs-only`
  - Export from `src/index.ts` only when a symbol is routed or consumed across a library boundary. `docs-only`
- **Durable state**:
  - `ProjectPageService`, root-provided, holding `_currentProjectIdSubject`, `_reloadProjectSubject` and a mutable `_currentProject` written by a `tap` inside `currentProject$`. The synchronous getter throws if nothing has subscribed yet. Seeded by `ProjectPageGuard.canActivate`, so navigation order matters.
  - `CollaborationPageService.reloadProjectMembers$` is a public BehaviorSubject that any consumer can push to.
  - `ViewRestrictionsPageService` and `ViewRestrictionsByPropertyPageService` each hold a private `Map` cache scoped to the page lifetime.

### vre/pages/data-browser

- **Nx project**: `vre-pages-ontology-data-browser`
- **Paths**: `libs/vre/pages/data-browser/**`
- **Purpose**: The resource list and viewer split pane used to browse a project's data. It is a component library, not a routed page; the route lives in `vre/pages/project/project`.
- **Key entities**: `ResourceBrowserComponent`, `MultipleViewerService`, `MultipleViewerComponent`, `ComparisonComponent`, `ResourcesListComponent`, `ResourceListItemComponent`, `ResourceLinkDialogComponent`, `ResourceClassCountApi`, `ProjectShortnameService`
- **Public interface**: Five named exports from `src/index.ts`.
- **Local-context kit**: `src/index.ts`, `src/lib/comparison/resource-browser.component.ts`, `src/lib/comparison/multiple-viewer.service.ts`, `src/lib/list-view/resources-list.component.ts`, `src/lib/project-shortname.service.ts`, `src/lib/stories.helpers.ts`, `libs/vre/shared/app-helper-services/src/lib/resource-result.service.ts`
- **Depends on**: `dsp-js`, `vre/3rd-party-services/open-api`, `vre/core/config`, `vre/core/session`, `vre/resource-editor/resource-editor`, `vre/shared/app-common`, `vre/shared/app-helper-services`, `vre/ui/progress-indicator`, `vre/ui/string-literal`, `vre/ui/ui`
- **Used by**: `vre/pages/project/project`, `vre/pages/search/advanced-search`, `vre/pages/search/search`
- **Boundary rules**:
  - The Nx project name says `ontology` but the folder and the alias do not. Use the alias. `docs-only`
  - `ResourcesListComponent`, `ResourceListComponent` and `ResourceListItemComponent` are three near-identical names; only the first is public. `docs-only`
- **Durable state**:
  - `MultipleViewerService`, provided in two different places, so which instance a component sees depends on its ancestor. It holds `_selectedResourcesSubject` plus two plain mutable public fields, `selectMode` and `searchKeyword`, written from outside this library. See Cross-cutting concerns.
  - `ProjectShortnameService`, a root-provided `Map` keyed by project IRI, `shareReplay`d and never invalidated, so a renamed project keeps its old shortname for the session. It is not exported from the barrel, so the cache is undiscoverable from outside.

### vre/pages/ontology/ontology

- **Nx project**: `vre-pages-ontology-ontology`
- **Paths**: `libs/vre/pages/ontology/ontology/**`
- **Purpose**: The data-model editor: the ontology landing page, the resource-class editor and the property editor, including cardinality and GUI-element configuration.
- **Key entities**: `OntologyEditService`, `OntologyPageService`, `MakeOntologyFor`, `ResourceClassInfo`, `PropertyInfo`, `ClassPropertyInfo`, `PropToAdd`, `PropertyForm`, `CreatePropertyData`, `CardinalityComponent`, `GuiAttrListComponent`
- **Public interface**: Four routed components. `OntologyEditService` is deliberately not exported; it is component-scoped.
- **Local-context kit**: `src/index.ts`, `src/lib/ontology-page.component.ts`, `src/lib/services/ontology-edit.service.ts`, `src/lib/services/make-ontology-for.ts`, `src/lib/ontology.types.ts`, `src/lib/forms/property-form/property-form.type.ts`, `libs/vre/shared/app-helper-services/src/lib/default-data/default-properties.ts`
- **Depends on**: `dsp-js`, `vre/3rd-party-services/api`, `vre/3rd-party-services/open-api`, `vre/core/config`, `vre/core/session`, `vre/pages/ontology/list`, `vre/pages/project/project`, `vre/pages/user-settings/user`, `vre/shared/app-common`, `vre/shared/app-common-to-move`, `vre/shared/app-helper-services`, `vre/ui/notification`, `vre/ui/progress-indicator`, `vre/ui/string-literal`, `vre/ui/ui`
- **Used by**: `dsp-app`
- **Boundary rules**:
  - The property-type registry is not in this library. Adding a property type touches `default-properties.ts` and `ontology.service.ts` in `vre/shared/app-helper-services`, then possibly `make-ontology-for.ts` here and a branch in `property-form.component.ts`. Four files, two libraries, no single registry. `docs-only`
  - `OntologyPageComponent` owns the DI scope through `providers: [OntologyPageService, OntologyEditService]`. `structure`
  - DSP-API calls the class-to-property assignment a "cardinality". Two code comments in this library complain about the name. See CONTEXT.md. `docs-only`
- **Durable state**: `OntologyEditService`, component-scoped, roughly 670 lines, holding `_currentOntology`, `_currentOntologyInfo`, `_projectOntologiesSubject`, `_listsInProjectSubject`, `_isTransacting` and `_canDeletePropertyMap`. Two of those are `take(1)` snapshots of parent state (DEV-7130), so a controlled vocabulary created in `vre/pages/ontology/list` is stale here until re-navigation. `latestChangedItem` is a public BehaviorSubject written both by the service and by `property-item.component.ts`.

### vre/pages/ontology/list

- **Nx project**: `vre-pages-ontology-list`
- **Paths**: `libs/vre/pages/ontology/list/**`
- **Purpose**: The controlled-vocabulary editor: the list page and its recursive node tree, plus the create and edit dialogs.
- **Key entities**: `ListPageComponent`, `ListInfoFormComponent`, `ListItemComponent`, `ListItemService`, `ListItemFormComponent`, `ReusableListItemFormComponent`, `ActionBubbleComponent`
- **Public interface**: Two exports. `ListInfoFormComponent` is exported solely so `vre/pages/ontology/ontology` can open it as a dialog.
- **Local-context kit**: `src/index.ts`, `src/lib/list-page.component.ts`, `src/lib/list-page.component.html`, `src/lib/list-item/list-item.service.ts`, `src/lib/list-item/list-item.component.ts`, `src/lib/list-item-form/list-item-form.component.ts`, `src/lib/list-info-form/list-info-form.component.ts`
- **Depends on**: `dsp-js`, `vre/3rd-party-services/api`, `vre/3rd-party-services/open-api`, `vre/core/config`, `vre/pages/project/project`, `vre/shared/app-common`, `vre/shared/app-helper-services`, `vre/ui/progress-indicator`, `vre/ui/string-literal`, `vre/ui/ui`
- **Used by**: `dsp-app`, `vre/pages/ontology/ontology`
- **Boundary rules**:
  - No cache. Every mutation calls `ListApiService` directly from a component and re-fetches. Writers are spread across six files. `docs-only`
  - `src/lib/list-page.component.ts` constructs a list IRI by string interpolation rather than through a helper. `docs-only`
  - This library has no unit tests and no stories. Its only coverage is the Cypress suite (`lists.cy.ts`, `list-management.cy.ts`), which runs in CI but is not type-checked. `docs-only`
- **Durable state**: `ListItemService`, component-scoped, holding `_projectInfos` and a bare public `onUpdate$` Subject that any of its three injectors can push to. An event bus with no ownership.

### vre/pages/search/advanced-search

- **Nx project**: `vre-pages-search-advanced-search`
- **Paths**: `libs/vre/pages/search/advanced-search/**`
- **Purpose**: The chip-bar query builder that lets a user assemble criteria over a project's data model, compiles them into a Gravsearch query and runs it. Its durable state is the URL.
- **Key entities**: `StatementElement`, `Predicate`, `Operator`, `PropertyObjectType`, `OrderByItem`, `GravsearchWriter`, `GravsearchService`, `generateGravSearchQuery`, `DerivedSearchStateService`, `StatementDraftStore`, `SearchUrlSyncService`, `OntologyDataService`, `buildStatementsFromFilterParams`
- **Public interface**: Five exports, including `provideAdvancedSearch()`. All services are internal.
- **Local-context kit**: `src/lib/service/search-url-sync.service.ts`, `src/lib/service/derived-search-state.service.ts`, `src/lib/service/gravsearch.service.ts`, `src/lib/service/gravsearch-writer.ts`, `src/lib/model.ts`, `src/lib/service/statement-draft.store.ts`, `README.md`
- **Depends on**: `dsp-js`, `vre/core/config`, `vre/core/error-handler`, `vre/core/session`, `vre/pages/data-browser`, `vre/pages/project/project`, `vre/shared/app-common`, `vre/shared/app-common-to-move`, `vre/shared/app-helper-services`, `vre/ui/date-picker`, `vre/ui/nested-menu`, `vre/ui/progress-indicator`, `vre/ui/string-literal`, `vre/ui/ui`
- **Used by**: `dsp-app`
- **Boundary rules**:
  - Gravsearch is assembled by string concatenation of template-literal fragments in `gravsearch-writer.ts` and `gravsearch.service.ts`. The injection defences live in `model.ts`, not in the writer: `escapeForGravsearchStringLiteral`, `escapeSparqlStringLiteral` and `sanitizeSparqlIri`. Values reach them from the untrusted `filters` URL parameter, so any new value path must route through an escaper. `review`
  - All eight services are page-scoped through `provideAdvancedSearch()`; none is root-provided. `structure`
  - Several inline comments record DSP-API behaviour verified empirically (DEV-6889 negation over multivalued properties, the `?mainRes` type-anchor rule). Those are backend constraints, not style. `docs-only`
  - The README names two classes that no longer exist: `SearchDerivationService` is now `DerivedSearchStateService`, `PropertyFormManager` is now `StatementDraftStore`. `docs-only`
- **Durable state**:
  - The URL query parameters `q`, `ontology`, `class`, `filters`, `orderBy`, `orderDir`. `SearchUrlSyncService.writeState` is the single write API but has four component writers.
  - `StatementDraftStore._statements`, ephemeral, with eleven public mutators called from six UI components. Bounded by the store's own API rather than by scattered subjects.
  - `OntologyDataService._selectedOntology`, written from three places including one component that bypasses the derivation, contradicting the README's claim that `writeState` is the only mutation point.

### vre/pages/search/search

- **Nx project**: `vre-pages-search-search`
- **Paths**: `libs/vre/pages/search/search/**`
- **Purpose**: Full-text search results pages, plus the shared result component. It also hosts `GlobalPageComponent`, the application shell for the home, help and profile routes, which does not belong here.
- **Key entities**: `SearchResultComponent`, `FulltextSearchResultsPageComponent`, `ProjectFulltextSearchPageComponent`, `GlobalPageComponent`, `SearchParamsService`
- **Public interface**: Six exports, of which only `FulltextSearchResultsPageComponent` and `GlobalPageComponent` are used outside the library.
- **Local-context kit**: `src/index.ts`, `src/lib/search-result.component.ts`, `src/lib/fulltext-search-results-page.component.ts`, `src/lib/project-fulltext-search-page.component.ts`
- **Depends on**: `dsp-js`, `vre/core/config`, `vre/core/error-handler`, `vre/pages/data-browser`, `vre/pages/project/project`, `vre/shared/app-common`, `vre/shared/app-common-to-move`, `vre/shared/app-helper-services`, `vre/ui/progress-indicator`, `vre/ui/ui`
- **Used by**: `dsp-app`
- **Boundary rules**:
  - Full-text search here is a different mechanism from the full-text field inside advanced search. This library calls `doFulltextSearch` with no Gravsearch involved. See CONTEXT.md. `docs-only`
  - `SearchParamsService` and `GravsearchSearchParams` have no references anywhere. `ProjectSearchPageComponent` and `ProjectFulltextSearchPageComponent` are orphaned because the project `search` route now redirects to advanced search. `docs-only`
- **Durable state**: none. `SearchParamsService` is the only stateful service and is unused.

### vre/pages/system/system

- **Nx project**: `vre-pages-system-system`
- **Paths**: `libs/vre/pages/system/system/**`
- **Purpose**: The system administration area: the `/system` shell and the all-projects and all-users lists with their dialogs. It also holds the cookie policy page and a generic sort button, neither of which is system administration.
- **Key entities**: `SystemPageComponent`, `ProjectsComponent`, `ProjectsListComponent`, `UsersTabComponent`, `UsersTabService`, `UsersListComponent`, `CreateUserDialogComponent`, `EraseProjectDialogComponent`, `MembershipComponent`, `SortButtonComponent`, `CookiePolicyComponent`
- **Public interface**: 15 exports from `src/index.ts`, including the `SystemComponents` array, which has no consumers.
- **Local-context kit**: `src/lib/system-page.component.ts`, `src/lib/projects/projects.component.ts`, `src/lib/projects/projects-list/projects-list.component.ts`, `src/lib/users/users-tab.component.ts`, `src/lib/users/users-list/users-list.component.ts`, `src/lib/users/users-list/users-list-row-menu.component.ts`, `src/index.ts`
- **Depends on**: `dsp-js`, `vre/3rd-party-services/api`, `vre/3rd-party-services/open-api`, `vre/core/config`, `vre/core/error-handler`, `vre/core/session`, `vre/pages/user-settings/user`, `vre/shared/app-common`, `vre/shared/app-common-to-move`, `vre/shared/app-helper-services`, `vre/ui/notification`, `vre/ui/progress-indicator`, `vre/ui/ui`
- **Used by**: `dsp-app`, `vre/pages/project/project`
- **Boundary rules**:
  - This library imports `AllProjectsService` from `vre/pages/user-settings/user`, a page depending on a page. The shared service lives in the library that reads like the leaf. `docs-only`
  - `ProjectsComponent` is routed from both this library's routes and `/my-profile/projects`, forking on an `@Input()`. A component spanning two libraries' routes is why neither has a clean boundary. `docs-only`
  - Every `Title.setTitle()` call here is hardcoded English that never passed through `en.json`, so it is invisible to translation. `docs-only`
- **Durable state**: `localStorage['sortProjectsBy']` written by `projects-list.component.ts`, and `localStorage['sortUsersBy']` written by `users-list.component.ts`. Both are raw string keys rather than constants, and `sortUsersBy` is cast unchecked to `UserSortKey`.

### vre/pages/user-settings/user

- **Nx project**: `vre-pages-user-settings-user`
- **Paths**: `libs/vre/pages/user-settings/user/**`
- **Purpose**: Nominally the account area. It also owns the public landing page, the application-wide `AllProjectsService`, and the root API-connection DI provider, none of which is user settings.
- **Key entities**: `UserComponent`, `ProfileComponent`, `AccountComponent`, `apiConnectionTokenProvider`, `EditUserDialogComponent`, `EditPasswordDialogComponent`, `ProjectOverviewComponent`, `ProjectCardComponent`, `AllProjectsService`, `existingNamesValidator`
- **Public interface**: 13 exports from `src/index.ts`, including `UserComponents`, which has no consumers.
- **Local-context kit**: `src/lib/account/api-connection-token.provider.ts`, `src/lib/user.component.ts`, `src/lib/account/account.component.ts`, `src/lib/profile/profile.component.ts`, `src/lib/project-overview/project-overview.component.ts`, `src/lib/project-overview/all-projects.service.ts`, `src/index.ts`
- **Depends on**: `dsp-js`, `vre/3rd-party-services/api`, `vre/core/config`, `vre/core/session`, `vre/shared/app-common-to-move`, `vre/shared/app-help-page`, `vre/shared/app-helper-services`, `vre/ui/notification`, `vre/ui/progress-indicator`, `vre/ui/ui`
- **Used by**: `dsp-app`, `vre/pages/ontology/ontology`, `vre/pages/project/project`, `vre/pages/system/system`
- **Boundary rules**:
  - `src/lib/account/api-connection-token.provider.ts` is the sole provider of `DspApiConnectionToken`, whose token is declared in `vre/core/config`. The application's root injector therefore cannot boot without loading this page library. Moving it to `core/config` or `core/session` is a one-line import change with no cycle; its only consumer is `apps/dsp-app/src/app/app.config.ts`. `docs-only`
  - That provider bypasses `AccessTokenService` and reads raw localStorage, so it never validates the token before seeding it. `docs-only`
  - This library has no unit tests at all. `apiConnectionTokenProvider`, the most consequential file in it, has neither a test nor a story. `docs-only`
- **Durable state**: `localStorage['ACCESS_TOKEN']` is read once here at DI factory time and written into `appConfigService.dspApiConfig.jsonWebToken`. That field has writers in three libraries.

### vre/resource-editor/resource-editor

- **Nx project**: `vre-resource-editor-resource-editor`
- **Paths**: `libs/vre/resource-editor/resource-editor/**`
- **Purpose**: The resource viewer and editor: media representations, property and value display and editing, regions, segments, compound navigation and the resource creation flow. The largest library in the repository at 413 files, with only four exports.
- **Key entities**: `ResourceFetcherService`, `ResourceDispatcherComponent`, `getResourceType`, `ResourceType`, `RegionService`, `SegmentsService`, `CompoundService`, `PropertiesDisplayService`, `PropertyValueService`, `FootnoteService`, `OsdDrawerService`, `RepresentationService`, `propertiesTypeMapping`, `fileValueMapping`, `TemplateViewerSwitcherComponent`, `TemplateEditorSwitcherComponent`
- **Public interface**: Exactly four components: `SingleResourcePageComponent`, `ResourceFetcherComponent`, `ResourceFetcherDialogComponent`, `CreateResourceDialogComponent`. No services, tokens or providers are exported.
- **Local-context kit**: this library has two independent registration axes and no single kit covers both. Pick the axis first.
  - Resource-type axis: `src/lib/resource-type.ts`, `src/lib/get-resource-type.ts`, `src/lib/resource-dispatcher.component.ts`, a sibling wrapper such as `src/lib/resource/plain/resource-plain.component.ts`, `src/lib/representation/resource-fetcher.service.ts`, `src/lib/representation/region.service.ts`
  - Value-type axis: `src/lib/properties/properties-display/template-switcher/template-viewer-switcher.component.ts`, `.../template-editor-switcher.component.ts`, `.../property-value/resource-payloads-mapping.ts`, `.../property-value/property-values.component.ts`, `.../property-value/property-value.service.ts`, `src/lib/representation/resource-fetcher.service.ts`
  - Sufficiency note: for a cross-cutting change, such as a new state flow or a permission rule, no bounded set exists. `RegionService` has eight writers on selection and `ResourceFetcherService.reload()` has eleven callers, so such a change needs roughly fifteen files open. This is the strongest case in the repository for a colocated CLAUDE.md.
- **Depends on**: `dsp-js`, `vre/3rd-party-services/api`, `vre/3rd-party-services/open-api`, `vre/core/config`, `vre/core/error-handler`, `vre/core/session`, `vre/shared/app-common`, `vre/shared/app-helper-services`, `vre/ui/date-picker`, `vre/ui/nested-menu`, `vre/ui/notification`, `vre/ui/progress-indicator`, `vre/ui/string-literal`, `vre/ui/ui`
- **Used by**: `dsp-app`, `vre/pages/data-browser`, `vre/pages/project/project`
- **Boundary rules**:
  - `template-viewer-switcher.component.ts` and `template-editor-switcher.component.ts` carry thirteen mirrored cases each and must be kept in sync by hand. Nothing enforces the mirror. `docs-only`
  - A new resource-type wrapper must declare `providers: [PropertiesDisplayService, ...]`. Omitting it is a silent runtime DI failure, not a compile error. `docs-only`
  - Adding a resource type means editing `resource-dispatcher.component.ts` in two places: the `@case` and the `imports:` array. `docs-only`
  - The value-viewer layer reaches into the representation layer by relative path (`properties/.../viewer-components/` importing from `representation/`). This is the one internal layering violation. `docs-only`
  - Four doc comments are the de facto architecture record: in `get-resource-type.ts`, `region.service.ts`, `property-value.service.ts` and `representation.service.ts`. `docs-only`
- **Durable state**: no application-wide domain state. Almost everything is component-scoped. The hotspots:
  - `RegionService._selectedRegion`, eight writers across five files. The OpenSeadragon canvas, the annotation tab and the toolbar all race to set selection. Highest-risk state in the library.
  - `RegionService._regionsSubject`, three write paths, where `filterToRegion` destructively narrows the same subject that pagination is still filling.
  - `ResourceFetcherService._resourceSubject`, whose `reload()` is called from eleven sites. Every mutation in the library funnels through a full refetch. This is the library's implicit change-propagation mechanism and it is undocumented.
  - `PropertiesDisplayService`, the only persistent state here, backed by `localStorage['SHOW_ALL_PROPERTIES']` and `['SHOW_ALL_COMMENTS']`. Twelve instances share the persisted value but not the live BehaviorSubject, so toggling in one does not propagate to another. The class has no `@Injectable()` decorator and works only because it has no constructor dependencies.

### build-tooling

- **Nx project**: none
- **Paths**: `tools/**`, `scripts/**`, `.storybook/**`, `types/**`, `@types/**`, `mocks/**`, `nx.json`, `tsconfig.base.json`, `package.json`, `package-lock.json`, `eslint.config.mjs`, `eslint.config.angular.mjs`, `jest.config.ts`, `jest.preset.js`, `.babelrc`, `.editorconfig`, `.prettierrc`, `.prettierignore`, `.nvmrc`, `.markdownlint.json`, `.remarkrc.json`, `codecov.yml`, `.kodus-readiness.yml`, `Makefile`, `vars.mk`, `.gitignore`, `libs/.gitkeep`
- **Purpose**: Build, lint, test and Storybook configuration for the whole workspace, plus ambient type declarations and test mocks.
- **Key entities**: `depConstraints`, `UiStandaloneComponents` (referenced from `.storybook/main.ts` glob), `merge-coverage.js`, `check-openapi-sync.sh`
- **Public interface**: `tsconfig.base.json` `compilerOptions.paths` is the authoritative list of library aliases and the thing the boundary lint matches on.
- **Local-context kit**: `tsconfig.base.json`, `nx.json`, `eslint.config.mjs`, `package.json`, `.storybook/main.ts`, `jest.preset.js`
- **Depends on**: none
- **Used by**: every component, implicitly
- **Boundary rules**:
  - Adding a library means adding its alias to `tsconfig.base.json` and creating its `project.json`. Nothing generates either. `docs-only`
  - `@nx/enforce-module-boundaries` is configured with a single permissive constraint (`sourceTag: '*'` to `onlyDependOnLibsWithTags: ['*']`), so it enforces barrel-only imports and buildable-library dependencies but no layering. `static-analysis`
  - The boundary lint is disabled for `**/*.spec.ts`, `**/environment*.ts` and all of `apps/dsp-app/cypress/`. It is not disabled for `**/*.stories.ts`, so stories do count toward the Nx project graph even when the runtime does not depend on the import. `static-analysis`
  - Storybook config lives at the workspace root but its targets are declared in `apps/dsp-app/project.json`. `docs-only`
- **Durable state**: `tsconfig.base.json` `paths`, 31 aliases. One of them, `@dasch-swiss/vre/ontology/ontology-properties`, points at a directory that does not exist and is referenced by nothing.

### ci-release

- **Nx project**: none
- **Paths**: `.github/**`, `renovate.json`, `release-please-config.json`, `.release-please-manifest.json`, `CHANGELOG.md`
- **Purpose**: Continuous integration workflows, dependency automation, and release automation for both the application and the published `dsp-js` package.
- **Key entities**: `release-dsp-js.yml`, `check-openapi-sync`, `release-please`
- **Public interface**: None.
- **Local-context kit**: `.github/workflows/`, `release-please-config.json`, `.release-please-manifest.json`
- **Depends on**: none
- **Used by**: none
- **Boundary rules**:
  - release-please owns `CHANGELOG.md` and every version field. Never hand-edit either. `review`
  - `dsp-js` publishes to NPM on `dsp-js-v*` tags via `.github/workflows/release-dsp-js.yml`. `docs-only`
  - `check-openapi-sync` runs on every push and opens an auto-bump PR on mismatch. A red check is expected while a dsp-api change is undeployed. `static-analysis`
  - `ci.yml` runs the Cypress suite as the `dsp-app-e2e-tests` matrix, gated by the required `dsp-app-e2e-tests-status` job. `static-analysis`
- **Durable state**: `.release-please-manifest.json`, the released version of record.

### deployment

- **Nx project**: none
- **Paths**: `Dockerfile`, `.dockerignore`, `nginx/**`, `docker-compose.observability.yml`
- **Purpose**: The production container image and the nginx configuration that serves the built application, including security headers and runtime config templating.
- **Key entities**: `default.conf.template`, `nginx-security-headers.conf`
- **Public interface**: The container image.
- **Local-context kit**: `Dockerfile`, `nginx/default.conf.template`, `nginx/nginx-security-headers.conf`, `apps/dsp-app/src/config/`
- **Depends on**: none
- **Used by**: none
- **Boundary rules**: The runtime config file that `apps/dsp-app/src/main.ts` fetches is supplied at deploy time. Changing the config schema means changing both `vre/core/config` and whatever provides `config.<env>.json`. `docs-only`
- **Durable state**: none in the repository.

### load-tests

- **Nx project**: none
- **Paths**: `k6/**`
- **Purpose**: A self-contained k6 load-testing setup with its own justfile, Docker Compose stack and Grafana dashboard. Independent of the Nx workspace.
- **Key entities**: `grafana_dashboard.json`, `justfile`
- **Public interface**: None.
- **Local-context kit**: `k6/README.md`, `k6/justfile`, `k6/docker-compose.yml`
- **Depends on**: none
- **Used by**: none
- **Boundary rules**: Not wired into Nx or CI. Run manually via its justfile. `docs-only`
- **Durable state**: none.

### project-docs

- **Nx project**: none
- **Paths**: `docs/**`, `mkdocs.yml`, `README.md`, `LICENSE`
- **Purpose**: The MkDocs documentation site and repository-level readme.
- **Key entities**: `mkdocs.yml` nav
- **Public interface**: The published documentation site.
- **Local-context kit**: `mkdocs.yml`, `docs/index.md`, `docs/contribution/index.md`
- **Depends on**: none
- **Used by**: none
- **Boundary rules**: Per-library `README.md` files are not part of this component and are largely stale. See Cross-cutting concerns. `docs-only`
- **Durable state**: none.

### agent-context

- **Nx project**: none
- **Paths**: `CLAUDE.md`, `ARCH-MAP.md`, `CONTEXT.md`, `.claude/**`
- **Purpose**: The instructions, skills and architecture records that agents read.
- **Key entities**: `update-openapi-client`, `format-project-image`
- **Public interface**: `CLAUDE.md` is loaded automatically. `ARCH-MAP.md` and `CONTEXT.md` are pull-on-demand and must not be `@`-imported.
- **Local-context kit**: `CLAUDE.md`, `ARCH-MAP.md`, `CONTEXT.md`, `.claude/skills/`
- **Depends on**: none
- **Used by**: none
- **Boundary rules**:
  - Two further `CLAUDE.md` files exist outside this component and are authoritative in their directories: `apps/dsp-app/src/assets/i18n/CLAUDE.md` and `apps/dsp-app/src/assets/images/project/CLAUDE.md`. `docs-only`
  - No library has its own `CLAUDE.md` and there are no ADRs anywhere in the repository. `docs-only`
- **Durable state**: none.

## Cross-cutting concerns

These are values or mechanisms that span components and would multiply-map if treated as components.

- **The dual client.** Two clients reach dsp-api. Domains read through dsp-js models (`ReadProject`, `ReadResource`, `CreateResource`) require changes in `libs/dsp-js/`; regenerating the OpenAPI client does not surface a field there. Endpoints consumed through the generated client only need `npm run update-openapi` after the API is deployed to dev. If a new backend field does not arrive in the UI, determine which client the reading code uses before debugging further. The generator's `serviceSuffix` is `ApiService`, which is also the hand-written convention, so a call site does not reveal which client it is on without reading the import path.

- **The JWT.** One logical value with four physical homes: `localStorage['ACCESS_TOKEN']`, `KnoraApiConfig.jsonWebToken` on the shared config object, `UserService._user$`, and the `Authorization` header built per request by `authInterceptorFn`. Writers span `vre/core/session`, `vre/core/config`, `vre/pages/user-settings/user` and `libs/dsp-js`. dsp-js requests read the in-memory config; `HttpClient` requests read localStorage per request. The two paths can disagree.

- **The current UI language.** `LocalizationService` in `vre/shared/app-helper-services` owns `_currentLanguage$`, `localStorage['dsp_language']`, `document.documentElement.lang` and `TranslateService.use()`. Three writers: its own `init()`, `LanguageSwitcherComponent` in `vre/shared/app-common-to-move`, and `AuthService` in `vre/core/session`. Never call `TranslateService.use()` directly.

- **Result paging.** `ResourceResultService` lives in `vre/shared/app-helper-services` but is a shared blackboard between libraries. `vre/pages/data-browser` owns the pager widget and writes `pageIndex` while reading `numberOfResults`; `vre/pages/search/*` and `vre/pages/project/project` own the fetchers and write `numberOfResults` while reading `pageIndex$`. It works only because the writer and reader share an injector subtree. `vre/pages/project/project`'s data-browser page provides the service and so does its descendant fetcher, so the pager resolves to the fetcher's instance and the page-level provider is silently unused.

- **Resource selection in the browser.** `MultipleViewerService` in `vre/pages/data-browser` carries plain mutable public fields written from `vre/pages/project/project`, across a library boundary, with no setter and no change notification.

- **`window.__FARO__`.** Written by `GrafanaFaroService` in `vre/3rd-party-services/analytics`, read by `ErrorReportingService` in `vre/core/error-handler`. A cross-library global with no DI token.

- **localStorage keys.** Six in total, owned by five different components: `ACCESS_TOKEN` (`vre/core/session`), `dsp_language` (`vre/shared/app-helper-services`), `SHOW_ALL_PROPERTIES` and `SHOW_ALL_COMMENTS` (`vre/resource-editor/resource-editor`), `sortProjectsBy` and `sortUsersBy` (`vre/pages/system/system`), `cookieBanner` (`dsp-app`). There is no shared registry of key names and no sessionStorage anywhere.

- **Stale per-library READMEs.** 17 of the 28 library `README.md` files name an Nx project that does not exist, because libraries were renamed and the generated readmes were not, so the `nx test <name>` command in them does not resolve. The 11 that do name their project correctly are `dsp-js`, `vre/3rd-party-services/api`, `vre/3rd-party-services/open-api`, `vre/3rd-party-services/analytics`, `vre/ui/nested-menu`, `vre/shared/app-common`, `vre/shared/app-common-to-move`, `vre/shared/app-helper-services`, `vre/shared/calendar`, and `vre/pages/search/advanced-search`; `vre/shared/assets/status-msg` names no project at all. Two of those carry a stale name alongside the correct one: `analytics` (`vre-shared-app-analytics` in the title) and `advanced-search` (`vre-advanced-search` in the heading, plus two renamed classes in its body). A separate trap: `vre/3rd-party-services/api`'s readme matches its `project.json`, but that project name (`vre-shared-app-api`) is itself stale relative to the library's path. Treat a library README's project name as unreliable and read `project.json` instead.

## Conventions

### Module granularity

- **Local-context kit budget: 7 files.** One library exceeds it honestly: `vre/resource-editor/resource-editor` needs two axis-specific kits of six, and no bounded kit at all for cross-cutting state changes. That is recorded as a sufficiency problem rather than hidden by raising the budget.
- **One component per Nx project.** The barrel `src/index.ts` is the only seam the toolchain checks, so components are drawn at that boundary.
- **Component names in this map are `tsconfig.base.json` path aliases**, not Nx project names. The two differ for most libraries, and several Nx names are actively misleading (`vre-pages-ontology-data-browser` for `libs/vre/pages/data-browser`, `vre-shared-app-api` for `libs/vre/3rd-party-services/api`, `vre-library-app-string-literal` for `libs/vre/ui/string-literal`). Each entry records its Nx name for `nx run`.

### Dependency direction

Recorded from the observed runtime graph, not from folder names.

| Rule | Enforcement |
|---|---|
| No dependency cycles between libraries. Verified: the graph is a clean DAG. | `static-analysis` (Nx) |
| No library imports `@dsp-app/*` in TypeScript. Verified clean. | `static-analysis` (Nx) |
| Imports cross a library boundary through the `@dasch-swiss/*` alias, never a deep path. | `static-analysis` (Nx), disabled for `*.spec.ts`, `environment*.ts` and `apps/dsp-app/cypress/**` |
| No library imports application SCSS. **Currently violated in 20 files across six libraries**, which `@use '../../../../../../../../apps/dsp-app/src/styles/config'`. Sass imports are invisible to the boundary lint. | `docs-only` |
| The `ui/*` tier depends only on `ui/*` and `dsp-js`. **Holds at runtime for five of six libraries.** The exception is `vre/ui/string-literal`, which genuinely needs `LocalizationService`. `vre/core/error-handler` also depends on `vre/ui/notification`, inverting the tier. | `docs-only` |
| `pages/*` libraries do not depend on each other. **Currently violated**: `project/project` to `system/system` and `user-settings/user`; `ontology/ontology` to `ontology/list`, `project/project` and `user-settings/user`; `system/system` to `user-settings/user`; both search libraries to `project/project`. | `docs-only` |

**Promotion path.** Every `docs-only` rule above could become `static-analysis` today. Nx tags already exist on four projects (`dsp-js` carries `scope:shared` and `type:data-access`; three `ui` libraries carry `type:ui`), but `depConstraints` in `eslint.config.mjs` is the permissive default, so no tag constrains anything. Populating tags on all 29 projects and writing real `depConstraints` would move the tier and page rules from hope to CI. The SCSS rule cannot be promoted this way, because no mechanism in the repository inspects Sass imports.

### Wiring

- **New page**: build it in a `pages/*` library, export it from that barrel, add the segment to `RouteConstants` in `vre/core/config`, register it in `apps/dsp-app/src/app/app.routes.ts`, add a navigation entry, add i18n keys to all four language files. Five independent edits with nothing enforcing consistency. There is no route registry and no codegen.
- **No lazy loading.** All 33 routes use eager `component:` references. Every page library is in the initial bundle.
- **Standalone components throughout.** No NgModule anywhere. Five libraries still export a bulk-import array (`UiStandaloneComponents`, `StringLiteralComponents`, `ProgressIndicatorComponents`, `SystemComponents`, `UserComponents`); none has any consumer. They are pre-standalone relics.
- **State scope**: page and feature state is a component-provided service listed in `providers:`. Root provision is reserved for genuinely application-wide services. `ResourceResultService` and `MultipleViewerService` show what happens when a component-provided service is provided at two levels of one tree.
- **Discovery by convention does not exist here.** Every extension point is an explicit registration: a `switch` arm, a table entry, a barrel line, or an `imports:` array. The registries are listed under Banned constructs below because several must be edited in pairs.

### Colocated documentation

- Tests and stories are colocated with their subject. Storybook is the de facto coverage mechanism in the UI-heavy libraries; several libraries have stories and no unit tests at all (`vre/pages/ontology/ontology`, `vre/pages/user-settings/user`), and `vre/pages/ontology/list` has neither.
- Story titles follow `Feature Area / Component / Scenario`, export names encode acceptance criteria, and every story needs a `play()` asserting a user-visible outcome. See `CLAUDE.md`.
- Stories that mount a real container break when that container's DI changes. When adding a dependency to a component that appears in stories, check which stories render it for real and stub the new providers there.
- No library has a `CLAUDE.md` and there are no ADRs. Where architectural reasoning exists it is in docblocks citing DEV ticket numbers, notably in `vre/core/error-handler` and `vre/resource-editor/resource-editor`.
- `.gitkeep.spec.ts` placeholders survive in several libraries that now have real specs.

### Banned constructs

| Locally attractive pattern | Why it couples globally | Supported alternative | Enforcement |
|---|---|---|---|
| Editing one of the two template switchers in `resource-editor` | `template-viewer-switcher` and `template-editor-switcher` mirror thirteen cases each; editing one leaves the other silently wrong for that value type | Edit both, plus `resource-payloads-mapping.ts`, and `file-value-mapping.ts` for file values | `docs-only` |
| Adding a property type in `pages/ontology/ontology` | The registry is in another library; the local edit compiles and does nothing | Add to `DefaultProperties.data` and branch `getDefaultProperty` in `vre/shared/app-helper-services`, then `_guiAttrFor` and the form branch here | `docs-only` |
| Adding a resource-type `@case` without the `imports:` entry | `resource-dispatcher.component.ts` needs both; missing the second fails at runtime, not at compile time | Edit both places, and declare `providers: [PropertiesDisplayService]` on the new wrapper | `docs-only` |
| Calling `TranslateService.use()` to change language | Bypasses `LocalizationService`, leaving localStorage and `document.lang` unsynchronised | Set `LocalizationService.currentLanguage` | `docs-only` |
| Reading or writing `localStorage['ACCESS_TOKEN']` directly | Two places already do, which is how an expired token can stay in the in-memory config after being removed from storage | Use `AccessTokenService` | `docs-only` |
| A new HTTP call inline in a component | Splits the API surface across the tree and hides which client is in use | Add an `*ApiService` to `vre/3rd-party-services/api` extending `BaseApi` | `docs-only` |
| Editing `dsp-api_spec.yaml` or `src/generated/**` | The spec edit desynchronises the client from the server and is overwritten by the next auto-bump; generated edits cannot be committed | Use the `update-openapi-client` skill | `review` for the spec, `structure` for generated |
| Building a Gravsearch fragment without an escaper | Values originate in the untrusted `filters` URL parameter | Route through `escapeForGravsearchStringLiteral`, `escapeSparqlStringLiteral` or `sanitizeSparqlIri` in `advanced-search/src/lib/model.ts` | `review` |
| Adding to `vre/shared/app-common-to-move` | It is the app shell mis-filed as shared, with fan-out already exceeding fan-in | Put shell code in the app or a shell library; put feature code in its feature library | `docs-only` |
| A `@JsonProperty` in dsp-js without the optional flag | `DISALLOW_NULL` with `CASE_STRICT` throws whenever the key is absent from any fixture or response | Pass `true` as the third argument unless the server always sends the field | `docs-only` |
