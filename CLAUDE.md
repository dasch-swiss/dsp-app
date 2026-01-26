# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Claude Code Operating Rules

### 1. Permission & Safety
- The assistant may freely **propose** changes, but must obtain **explicit, unambiguous user approval** before:
  - Modifying code or files  
  - Creating, deleting, modifying or moving files/directories  
  - Running commands that modify the codebase  
  - Installing or updating dependencies  
  - Running migrations or commands with side effects  
  - Executing long-running or resource-intensive operations  
  - Making commits or pushing changes  
- Read-only actions (searching, linting, listing, analysis) **do not require** permission, shouldn't be however overused.  
- If approval is unclear, the assistant must ask for clarification.

### 2. Non-Repository File System Safety
- The assistant must **not** modify, create, move, or delete files or directories **outside the project repository** unless explicitly instructed by the user.
- If the assistant detects that a requested operation would affect the broader system (e.g., user home directory, OS configuration, global environment files, unrelated projects), it must:
  - Clearly **highlight** this fact to the user  
  - Explain potential risks or side effects  
  - Request explicit, unambiguous permission before proceeding  
- If the user does not explicitly grant permission, the assistant must refuse to perform the operation and propose safe alternatives when possible.

### 3. Minimal & Efficient Actions
- The assistant should avoid performing unnecessary operations, analyses, or commands.
- Whether read-only or modifying, actions should be taken **only when they are needed** to fulfill the current task or when explicitly requested by the user.
- Before initiating multiple, expensive, or broad operations (e.g., scanning the entire repository, running several analyses, generating large outputs), the assistant should:
  - briefly explain why these actions might be needed, and
  - ask whether the user wants them executed.
- The assistant should avoid verbose or redundant outputs and prefer concise summaries unless more detail is requested.

### 4. Planning & Execution
- For multi-step tasks, propose a **step-by-step plan** and request approval before starting.  
- After approval of the plan, ask before executing **each step**, unless the user explicitly authorizes executing all steps without further prompts.  
- If a task includes multiple scopes (e.g., refactor + feature + tests), confirm whether to treat them separately.

### 5. Proposing Solutions
- Always propose the **best-practice solution first**, followed by clearly labeled alternatives (e.g., “quick fix”, “minimal change”).  
- When proposing changes, provide **diffs/patch-style output** by default; provide full files only if requested.  
- If repository conventions conflict with best practices, ask which to prioritize.  
- If user instructions conflict with conventions or principles, seek clarification.

### 6. Design Principles
- Use established principles (SOLID, DRY, KISS, YAGNI) when appropriate to the task.  
- Avoid introducing complexity or over-engineering.  
- If applying a principle requires major structural changes, propose the idea first and wait for explicit approval.  
- When a proposal is influenced by a principle, state which one for transparency.

### 7. Testing Guidelines
- Add tests only within the **scope of the task**.  
- Avoid over-testing or redundant tests; check existing coverage first.  
- Cover meaningful edge cases and ensure regression safety.  
- Follow repository test conventions unless directed otherwise.  
- Suggest tests for unrelated components only as follow-up items.

### 8. Refactoring & Cleanup
- After refactoring or moving code, perform relevant cleanup such as:
  - Removing unused imports  
  - Deleting deprecated files  
  - Removing orphan tests or unused code  
  - Consolidating duplicate logic  
  - Updating documentation  
- Before cleanup, verify whether any remaining issues **within the task scope** still need improvement.  
- Do not expand cleanup or refactoring beyond the approved scope without permission.

### 9. Risk & Limitations
- If something is risky, unclear, or cannot be performed safely:
  - Explain the issue  
  - Provide safe alternatives  
  - Ask whether to proceed  

### 10. Clarity, Context & Output Management
- If repository context or file state is incomplete or ambiguous, ask clarifying questions before proposing or performing changes.  
- For large diffs or multi-file updates, summarize first and ask whether to show the full details.  
- Ensure all actions are transparent, scoped, and reversible.

## Project Overview

This is DaSCH Service Platform (DSP) monorepo - a digital humanities platform for storing, sharing, and working with primary research resources and data. Built with Angular, NX, and Node.js (see [package.json](package.json) for current versions).

The main application is **DSP-APP** - a user interface for the Swiss National Data and Service Center for the Humanities (DaSCH) research data repository, connecting to DSP-API backend and implementing DSP-JS client library.

## Essential Development Commands

### Local Development
- `npm run start-local` or `nx run dsp-app:serve` - Start local development server
- `npm run start-local-with-observability` - Start local dev server with Grafana observability stack (Loki, Tempo, Grafana UI)
- `npm run start-dev` - Start with dev server configuration

### Testing
- `npm run test-local` or `nx run dsp-app:test` - Run tests for main app
- `npm run test-ci-all` or `nx run-many --all --target=test --configuration=ci` - Run all tests in CI mode
- `npm run e2e-local` - Open Cypress UI for E2E tests  
- `npm run e2e-ci` - Run E2E tests in headless mode

### Building and Linting
- `npm run build` or `nx run dsp-app:build` - Build for development
- `npm run build-prod` or `nx run dsp-app:build:production` - Build for production
- `npm run lint-all` or `nx run-many --all --target=lint` - Lint all libs without auto-fix
- `npm run lint-fix-all` or `nx run-many --all --target=lint --fix` - Lint all libs with auto-fix

### OpenAPI Code Generation
- `npm run generate-openapi-module` - Generate TypeScript client from OpenAPI spec
- `npm run check-openapi-sync` - Smart diff check ignoring metadata (same logic as CI)
- `npm run update-openapi` - Update spec file and regenerate client (one command)
- Uses local spec file `libs/vre/3rd-party-services/open-api/dsp-api_spec.yaml`
- Smart diff via `scripts/check-openapi-sync.sh` ignores metadata changes
- Only fails on meaningful changes (endpoints, schemas, parameters)
- Script supports `--verbose` flag for detailed diff output

### Library Development
- `nx run [library-name]:test` - Test specific library
- `nx run [library-name]:lint` - Lint specific library
- `nx run [library-name]:build` - Build specific library

### Code Coverage
- `npm run unit-test-coverage` - Generate combined unit test coverage for all projects
- `npm run unit-test-coverage-ci` - CI-mode coverage with reports
- `npm run e2e-coverage` - E2E test coverage with instrumentation
- Coverage merging via `tools/merge-coverage.js` and `tools/lcov-parser.js`

### Additional Commands
- `npm run lint-fix-all` - Lint and fix all projects in monorepo
- `npm run lint-ci-all` - Lint all projects without auto-fix

## Architecture Overview

### Monorepo Structure
- **apps/dsp-app/** - Main Angular application
- **apps/dateAdapter/** - Standalone date adapter application
- **libs/vre/** - Virtual Research Environment libraries (core functionality)
- **libs/jdnconvertiblecalendar/** - Calendar conversion utilities
- **docs/** - MkDocs documentation

### VRE Library Architecture
The `libs/vre/` directory follows domain-driven design with clear separation:

- **3rd-party-services/** - External integrations (analytics, API, OpenAPI)
- **core/** - Foundation services (config, error-handler, session, state)
- **pages/** - Feature pages (ontology, project, search, system, user-settings)
- **resource-editor/** - Resource editing (properties, representations, forms) 
- **shared/** - Common utilities and services
- **ui/** - Reusable UI components

### Key Patterns
- **exposing exported files** via `*.index.ts` files
- **TypeScript path mapping** with `@dasch-swiss/vre/*` aliases
- **Feature-based organization** by domain
- **Reactive programming** with RxJS observables
- **Component Store** for local state management

## Environment Configurations

Multiple environment configurations available:
- `development` - Local development
- `dev-server` - Development server environment
- `ls-test-server` - LS test server environment
- `stage-server` - Staging environment
- `production` - Production environment

## Development Notes

### Code Style
- Uses ESLint with Airbnb TypeScript configuration
- Prettier for code formatting
- Import ordering enforced alphabetically
- Focus tests (fit, fdescribe) are banned in CI
- Self-closing tags for component selectors in templates
- no usage of ::ng-deep
- Control Flow syntax

### Testing Framework
- **Jest** for unit tests with Angular-specific preset
- **Cypress** for E2E tests with multiple configurations
- Code coverage reporting available
- **ng-mocks** for advanced Angular component mocking

### TypeScript Configuration
- **Target:** ES2022 with ES2020 modules
- **Library support:** ES2021 + DOM APIs
- **Strict template checking** enabled via Angular compiler
- **Path aliases** for all VRE libraries (see [tsconfig.base.json](tsconfig.base.json))
- **Skip lib check** enabled for faster compilation
- **Experimental decorators** and decorator metadata enabled for Angular

### NX Integration  
- Libraries can be tested/built independently
- Dependency graph enforcement via ESLint rules
- Caching enabled for build, test, and lint operations
- Uses NX Console for IDE integration

### Internationalization
Multi-language support with translation files in:
- `apps/dsp-app/src/assets/i18n/` (de.json, en.json, fr.json, it.json, rm.json)

### Resource Management
Application handles various file types and representations:
- Images, videos, audio files with annotation support
- PDF documents and text files
- IIIF integration for image viewing
- Media segment annotations for time-based resources

## Observability and Monitoring

### Grafana Faro Integration
The application includes comprehensive observability using Grafana Faro:
- **@grafana/faro-web-sdk** - Web observability SDK for real user monitoring
- **@grafana/faro-web-tracing** - Distributed tracing integration
- **@grafana/faro-transport-otlp-http** - OTLP transport for telemetry data
- Start with observability stack: `npm run start-local-with-observability`
- Includes Loki (logs), Tempo (traces), and Grafana UI dashboard
- Configuration defined in environment-specific config files

### Sentry Error Tracking
Error tracking and performance monitoring with Sentry:
- **@sentry/angular** - Angular-specific Sentry integration
- **@sentry/cli** - Command-line tool for sourcemap uploads
- Upload sourcemaps: `npm run sentry:sourcemaps`
- Integrated into application bootstrap in `main.ts`
- Provides real-time error reporting and performance metrics

### Docker Integration
Local observability infrastructure via Docker Compose:
- `docker-compose.observability.yml` - Defines observability stack
- Automatically started with observability development command
- Grafana dashboard accessible at localhost after startup

## DSP-JS Client Library (Most Crucial Dependency)

**@dasch-swiss/dsp-js** is the primary API client library for communicating with DSP-API backend. It's deeply integrated throughout the application and essential for all data operations. See [package.json](package.json) for the current version.

### Configuration and Setup

**Core Configuration Services:**
- `AppConfigService` creates `KnoraApiConfig` with environment-specific API settings
- `DspApiConnectionToken` provides dependency injection for `KnoraApiConnection`
- Configuration includes: `apiProtocol`, `apiHost`, `apiPort`, `apiPath`, `jsonWebToken`, `logErrors`

**Dependency Injection Pattern:**
```typescript
constructor(
  @Inject(DspApiConnectionToken)
  private _dspApiConnection: KnoraApiConnection
) {}
```

### Key DSP-JS Classes and Types

**Core API Classes:**
- `KnoraApiConnection` - Main API connection instance
- `KnoraApiConfig` - Configuration class
- `ApiResponseError` - Error handling

**Resource Types:**
- `ReadResource` - Main resource representation
- `ReadLinkValue`, `ReadStillImageFileValue` - Value types
- `ResourcePropertyDefinition`, `ResourceClassDefinition` - Schema definitions

**Ontology Types:**
- `ReadOntology`, `UpdateOntology` - Ontology operations
- `PropertyDefinition` - Property schema definitions

### Common API Patterns

**Resource Operations:**
```typescript
// Get resource
this._dspApiConnection.v2.res.getResource(resourceIri, resourceVersion)

// Search operations
this._dspApiConnection.v2.search.doSearchByLabel(searchValue, offset, options)
```

**Authentication:**
```typescript
// Login/logout
this._dspApiConnection.v2.auth.login(identifierType, identifier, password)
this._dspApiConnection.v2.auth.logout()
```

**Ontology Operations:**
```typescript
// Get ontology (with caching)
this._dspApiConnection.v2.ontologyCache.getOntology(ontologyIri)
this._dspApiConnection.v2.onto.getOntologiesByProjectIri(projectIri)
```

**Admin Operations:**
```typescript
// Project management
this._dspApiConnection.admin.projectsEndpoint.getProjectByIri(projectIri)
this._dspApiConnection.admin.usersEndpoint.addUserToProjectMembership(userId, projectIri)
```

### Constants Usage

DSP-JS `Constants` are extensively used throughout the codebase:
- `Constants.KnoraApiV2` - API version constants
- `Constants.TextValue`, `Constants.IntValue`, `Constants.LinkValue` - Value types
- `Constants.HasLinkTo`, `Constants.IsPartOf` - Property types
- `Constants.SystemProjectIRI` - System identifiers

### Error Handling Patterns

**Standard Error Handling:**
```typescript
.pipe(
  catchError(error => {
    if (error instanceof ApiResponseError && error.status === 400) {
      throw new UserFeedbackError('Custom message');
    }
    throw error;
  })
)
```

### Key Features

**Caching Strategy:**
- Ontology caching via `_dspApiConnection.v2.ontologyCache`
- Resource caching in NGXS state
- Cache invalidation and reload mechanisms

**JWT Token Management:**
- Automatic token injection from localStorage
- Session management and token refresh
- Authentication state tracking

**Multi-language Support:**
- `StringLiteral` type for internationalized content
- Language-specific resource labels and descriptions

**File Handling:**
- Specialized support for images, videos, audio, PDFs
- IIIF integration for image viewing
- Media annotation capabilities

### Development Commands for DSP-JS

- `npm run yalc-add-lib` - Add local DSP-JS development version for testing
- Check [package.json](package.json) for current version

## Working with APIs

- **DSP-API** backend integration via DSP-JS client library (see detailed section above)
- **OpenAPI** generated client in `libs/vre/3rd-party-services/open-api`
- Authentication via JWT tokens managed by session services
- Error handling centralized in core error-handler library

## External Dependencies

Key external libraries:
- **@dasch-swiss/dsp-js** - DSP API client library (see detailed section above)
- **@angular/material** - UI components
- **openseadragon** - Image viewer
- **ckeditor5-custom-build** - Rich text editing
- **cypress** - E2E testing
