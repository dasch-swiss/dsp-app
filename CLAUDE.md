# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Permission Protocol

**ALWAYS ask for explicit permission before:**
- Making any code changes or modifications
- Creating new files or directories  
- Deleting or removing any files
- Running commands that modify the codebase
- Installing or updating dependencies
- Making commits or pushing changes

Only proceed with changes after receiving clear approval from the user.

## Project Overview

This is DaSCH Service Platform (DSP) monorepo - a digital humanities platform for storing, sharing, and working with primary research resources and data. Built with Angular 18.2.9, NX 19.8.9, and Node.js 20.11.1.

The main application is **DSP-APP** - a user interface for the Swiss National Data and Service Center for the Humanities (DaSCH) research data repository, connecting to DSP-API backend and implementing DSP-JS client library.

## Essential Development Commands

### Local Development
- `npm run start-local` or `nx run dsp-app:serve` - Start local development server
- `npm run start-test` - Start with test server configuration
- `npm run start-dev` - Start with dev server configuration

### Testing
- `npm run test-local` or `nx run dsp-app:test` - Run tests for main app
- `npm run test-ci-all` or `nx run-many --all --target=test --configuration=ci` - Run all tests in CI mode
- `npm run e2e-local` - Open Cypress UI for E2E tests  
- `npm run e2e-ci` - Run E2E tests in headless mode

### Building and Linting
- `npm run build` or `nx run dsp-app:build` - Build for development
- `npm run build-prod` or `nx run dsp-app:build:production` - Build for production
- `npm run lint-local` or `nx run dsp-app:lint --fix` - Lint with auto-fix
- `npm run lint-ci` or `nx run dsp-app:lint` - Lint without auto-fix

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

### State Management
Uses **NGXS** for state management with domain-specific states:
- User, Projects, Ontologies, Lists, OntologyClass, Resource, Config states
- Actions and selectors co-located with state files

### Key Patterns
- **Barrel exports** via `*.components.ts` files
- **exposing exported files** via `*.index.ts` files
- **TypeScript path mapping** with `@dasch-swiss/vre/*` aliases
- **Feature-based organization** by domain
- **Reactive programming** with RxJS observables

## Environment Configurations

Multiple environment configurations available:
- `development` - Local development
- `test-server` - Test server environment
- `dev-server` - Development server environment
- `ls-test-server` - LS test server environment
- `0845-test-server` - Specific test server environment
- `stage-server` - Staging environment
- `production` - Production environment

## Development Notes

### Code Style
- Uses ESLint with Airbnb TypeScript configuration
- Prettier for code formatting
- Import ordering enforced alphabetically
- Focus tests (fit, fdescribe) are banned in CI
- Self-closing tags for component selectors in templates

### Testing Framework
- **Jest** for unit tests with Angular-specific preset
- **Cypress** for E2E tests with multiple configurations
- **Karma** as fallback test runner for some configurations
- Code coverage reporting available

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

## DSP-JS Client Library (Most Crucial Dependency)

**@dasch-swiss/dsp-js v10.8.0** is the primary API client library for communicating with DSP-API backend. It's deeply integrated throughout the application and essential for all data operations.

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

### State Management Integration

DSP-JS is integrated with NGXS state management:
- **ProjectsState** - Project data, members, groups
- **OntologiesState** - Ontology loading with caching
- **UserState** - Authentication and profile management  
- **ResourceState** - Current resource data

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

- `npm run yalc-add-lib` - Add local DSP-JS development version
- Check `package.json` for current version: `@dasch-swiss/dsp-js: 10.8.0`

## Working with APIs

- **DSP-API** backend integration via DSP-JS client library (see detailed section above)
- **OpenAPI** generated client in `libs/vre/3rd-party-services/open-api`
- Authentication via JWT tokens managed by session services
- Error handling centralized in core error-handler library

## External Dependencies

Key external libraries:
- **@dasch-swiss/dsp-js** - DSP API client library (see detailed section above)
- **@angular/material** - UI components
- **@ngxs/store** - State management
- **openseadragon** - Image viewer
- **ckeditor5-custom-build** - Rich text editing
- **cypress** - E2E testing
