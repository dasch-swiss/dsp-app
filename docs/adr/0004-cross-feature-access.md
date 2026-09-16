# ADR-0004: Cross-feature access

- **Status:** Accepted (2026-09-13)
- **Relates to:** ADR-0001 (library taxonomy), ADR-0003 (feature state), ADR-0005 (what `shared/` means)
- **Adapts:** dasch-ops-platform ADR-0013 (cross-capability access, the Modulith contract)

## Context

ADR-0001 forbids a page library from importing another page library, expressed as a scope constraint. This ADR says what to do instead, and triages the eleven edges that exist today (measured as in ADR-0001: `main` at `238000ec2`, runtime code only).

The dasch-ops-platform repository solved the equivalent problem for a Rust backend in its ADR-0013. Its core moves are worth restating because some of them transfer directly: each capability owns its data and is the sole writer; capabilities collaborate only through a **consumer-defined port**, a narrow interface declared by the consumer and implemented by the provider; ports are never shared between consumers; cross-context references are **opaque ids**, with details fetched through the port; and the guiding line is **share concepts, never shapes**.

It would be easy to carry all of that over and get a worse frontend. The backend pattern buys the ability to extract a capability into a separate service, and pays for it with a port and an adapter per cross-context need. This application is a single bundle, a single runtime and a single Angular dependency-injection tree. Nothing here is ever extracted to a network service, so the thing the indirection buys does not exist.

So the honest carry-over is narrower than the source. Looking at what the eleven edges actually contain:

| Symbol | Importers | What it really is |
| --- | --- | --- |
| `ProjectPageService` | 3 other page libraries, 16 files | a data-access service that resolves the current project, holding page state |
| `AllProjectsService` | 2 other page libraries, 3 files | a data-access service listing projects |
| `ResourceBrowserComponent` | both search libraries | a reusable presentational component |
| `MultipleViewerComponent`, `MultipleViewerService`, `ResourcesListComponent`, `ResourceClassCountApi` | `pages/project` | data-browser internals embedded in the project page |
| `EditUserDialogComponent`, `EditPasswordDialogComponent`, `EditUserDialogProps`, `EditPasswordDialogProps`, `CreateUserDialogComponent`, `UserDescriptionComponent`, `ProjectImageCoverComponent` | `pages/project`, `pages/system` | user-management dialogs reused by two pages |
| `MenuItem` | `pages/project` | a type |
| `existingNamesAsyncValidator` | `pages/ontology` | a form validator |
| `ListInfoFormComponent` | `pages/ontology/ontology` | a component in the same domain |

Not one of these is a case where a feature needs the behaviour of another feature. Every one is a piece of shared code that was written where it was first needed and never moved. The cross-feature edges are a symptom of missing libraries, not of genuine feature coupling. A port-and-adapter pattern applied to this list would add indirection to symbols that simply need to be in a different folder, or a different tag.

Counted by file rather than by symbol, and with `pages/data-browser` tagged `scope:shared` per decision 7, the scope constraint in ADR-0001 rejects thirteen edges across thirty-three files:

| Source | Target | Files |
| --- | --- | --- |
| `pages/ontology/ontology` | `pages/project/project` | 12 |
| `pages/project/project` | `pages/user-settings/user` | 5 |
| `pages/ontology/ontology` | `pages/user-settings/user` | 3 |
| `pages/system/system` | `pages/user-settings/user` | 3 |
| `pages/ontology/list` | `pages/project/project` | 2 |
| `pages/ontology/ontology` | `shared/app-common-to-move` | 2 |
| `pages/project/project` | `pages/system/system` | 2 |
| `pages/search/advanced-search` | `pages/project/project` | 2 |
| `pages/user-settings/user` | `shared/app-common-to-move` | 2 |
| `pages/project/project` | `shared/app-common-to-move` | 1 |
| `pages/search/advanced-search` | `shared/app-common-to-move` | 1 |
| `pages/search/search` | `shared/app-common-to-move` | 1 |
| `pages/system/system` | `shared/app-common-to-move` | 1 |

Three further edges exist and are legal under that tagging: `pages/project/project -> pages/data-browser` (4 files), `pages/search/advanced-search -> pages/data-browser` (1) and `pages/search/search -> pages/data-browser` (1). A fourth, `pages/ontology/ontology -> pages/ontology/list` (1), is legal because both carry `scope:ontology`.

The distribution matters more than the total. Fourteen of the thirty-three files are a single scope edge, `ontology -> project`, and every one of them imports `ProjectPageService`. Relocating that one service to `scope:shared, type:data-access` clears those fourteen on its own, and `AllProjectsService` clears much of the rest.

## Decision

1. **A feature library may not import another feature library.** Enforced by the scope constraint in ADR-0001. (**static-analysis**)

2. **The default resolution is relocation, not indirection.** (**review**)

   When two features need the same code, move it rather than invert it. The target follows from what it is, using the ADR-0001 taxonomy:

   - a service that fetches or derives data goes to `scope:shared, type:data-access`; if it also holds state, the component that owns that state's lifetime provides it (ADR-0003), and relocating the class does not change who provides it
   - a presentational component goes to `scope:shared, type:ui`
   - a pure function, a type or a validator goes to `scope:shared, type:util`
   - a whole feature genuinely used by two domains goes to `scope:shared, type:feature`, which is what `resource-editor` already is and what `data-browser` becomes (decision 7)

   This is the answer for eleven of the seventeen symbols above. The five `data-browser` symbols need nothing once decision 7 applies, and `ListInfoFormComponent` needs no action, because `pages/ontology/ontology` and `pages/ontology/list` share `scope:ontology`.

   `ProjectPageService` shows both halves of the first bullet together. Three other page libraries import it, so the class moves to `scope:shared, type:data-access`. It holds two `BehaviorSubject`s, so after the move it is not root-provided: `ProjectPageComponent` provides it, and the ontology, list and advanced-search routes, all children of that component, inject the ancestor's instance. ADR-0003 decision 1 records the same resolution and the guard-seeding constraint that comes with it.

3. **Features are composed by the application, through the routing table.** (**structure**)

   `apps/dsp-app/src/app/app.routes.ts` already imports all seven routed page libraries and is the only place that knows about all of them. (`pages/data-browser` is not routed from there: `pages/project` routes to it through `DataBrowserPageComponent`, which is one of the reasons decision 7 treats it as shared.) It stays that way. A page that needs to send the user somewhere else routes there; it does not import the destination.

4. **Where a feature genuinely needs behaviour from another feature, it declares the interface it needs and the application wires it.** (**review**)

   This is ADR-0013's consumer-defined port, reduced to what a single DI tree needs. The consumer declares an abstract class or `InjectionToken` describing exactly what it requires, in its own library. The provider stays a plain service in its own library and imports nothing of the consumer. The adapter that implements the consumer's token on top of the provider's service lives in `apps/dsp-app`, which binds it at bootstrap. It has to live there: under decision 1 neither feature may import the other, and `scope:app` is the only scope allowed to import both.

   Two rules from ADR-0013 carry over unchanged and matter more than the mechanism:

   - **Ports are never shared between consumers.** Two features needing similar data from a third each declare their own. There is no central contracts library, because a central contracts library becomes the next `app-helper-services` (ADR-0005).
   - **The port lives with the consumer that defined it**, so it keeps that authorship.

   This decision is expected to be used rarely, and possibly never. It is recorded so that the answer exists when relocation genuinely does not fit, and so that nobody reaches for a shared contracts library instead.

5. **Cross-feature references are opaque ids.** (**review**)

   Where one feature refers to something another feature owns, it stores and passes the identifier, an IRI, a shortcode, a project id, and resolves details through a shared data-access service at the point of use. It does not hold a hydrated object owned by another feature. This is ADR-0013's decision 5, and it transfers cleanly because the reason is the same: a stored identifier survives changes to the owner's model, and a stored object does not.

6. **Share concepts, never shapes.** (**review**)

   A type that is genuinely the same concept everywhere belongs in a shared `type:util` library. A shape that merely happens to match, particularly a generated DTO from `3rd-party-services/open-api`, does not become shared code because two places need something like it. ADR-0001 decision 7 applies this to `LanguageStringDto` in `ui/string-literal`: the UI library declares the two fields it needs rather than importing the generated DTO.

7. **`pages/data-browser` is tagged `scope:shared, type:feature`.** (**static-analysis**)

   The question was whether it is a page or shared infrastructure, and the import graph answers it without product input. `apps/dsp-app/src/app/app.routes.ts` never imports it: the route that shows it is `DataBrowserPageComponent` in `pages/project`. `pages/project` embeds four of its internals (`MultipleViewerComponent`, `MultipleViewerService`, `ResourcesListComponent`, `ResourceClassCountApi`) across four files, and both search libraries embed `ResourceBrowserComponent`. A library that nothing routes to and that three features render inside themselves is shared infrastructure, whatever folder it sits in. It carries the same tags as `resource-editor`, and the six imports of it across five files become legal with no code moving. The folder is a hint and the tag is the truth (ADR-0001 decision 4); it leaves `pages/` opportunistically, because that rename touches every importer and buys nothing the tag does not.

## What does not transfer from ADR-0013

Stating this explicitly, because adopting the vocabulary without the limits would overclaim:

- **Independent deployment.** There is one bundle. No feature is ever deployed separately, so nothing here needs to survive a network boundary.
- **Separate datastores and data sovereignty over tables.** There is no database in the browser. The ownership rule that replaces it is ADR-0003's one-writer-per-value, which is about DI-scoped state rather than schemas.
- **Per-module transactions and eventual consistency.** There is one runtime and one change-detection cycle. The distributed-transaction discussion has no analogue.
- **The extraction test.** ADR-0013 asks whether a module could be extracted to a service without touching callers. Here the useful version is weaker and worth keeping anyway: could this library be deleted, or lazily loaded on its own route, without editing another library? Today the answer for every page library is no, which is exactly why the routing table cannot use `loadComponent`.
- **Bazel visibility.** Replaced by Nx tags (ADR-0001), which are weaker: they see TypeScript imports and not Sass, templates or asset strings.

## Consequences

**Positive.** The seventeen symbols get a decision rather than accumulating. `scope:shared` acquires an actual definition, which ADR-0005 then polices. Route-level lazy loading becomes reachable, since the reason it is impossible today is precisely that every page is reachable from every other. The routing table stays the one place that knows the whole application.

**Negative and costs.** Relocating eleven symbols touches thirty-three files plus both barrels on each move, and `CLAUDE.md` already warns that a missed barrel export breaks consumers at build time. Until the moves land, ADR-0001's constraint block cannot be switched on, so this ADR is on the critical path for that one.

**`data-browser`.** Decision 7 settles the highest-leverage question in the migration by tagging rather than moving: six imports across five files stop being violations. What it does not settle is when the library leaves the `pages/` folder. That is a rename touching every importer and is done opportunistically, as ADR-0001 decision 4 says for every folder-versus-tag mismatch.

**Risk.** Decision 2 makes `scope:shared` the destination for everything that two features need. Applied without judgment, that grows a shared tier that is itself a big ball of mud, which is the failure ADR-0005 exists to prevent. Relocation is the default answer, not an automatic one.

## Alternatives rejected

- **Permit `feature -> feature`, as canonical Nx does.** It is the status quo and it produced eleven edges nobody decided to create. The edges are cheap to add one at a time and expensive to remove in aggregate, which is the signature of a rule that should be mechanical rather than advisory.
- **A shared kernel containing the common domain model.** The obvious move, and the one that produces `app-helper-services`. Khononov's objection, quoted in Angular Architects' 2025 treatment of Angular monorepos, is the relevant one: the shared kernel undermines the idea of the bounded context and therefore demands a sound justification. Every feature depending on one shared model means every model change touches every feature. Rejected as a default; per-purpose shared libraries under decision 2 are the alternative.
- **Port and adapter for every cross-feature need, as ADR-0013 mandates for the backend.** Correct there, where the payoff is service extraction. Here it would add an interface and a binding to seventeen symbols whose actual problem is that they are in the wrong folder, and the payoff does not exist in a single bundle. Kept as decision 4 for the genuine case and rejected as the default.
- **A central `contracts` or `ports` library.** Explicitly rejected by ADR-0013 for the backend, and the reasoning applies unchanged: it becomes a god module that every feature depends on, and it strips each interface of the authorship of the consumer that defined it.
