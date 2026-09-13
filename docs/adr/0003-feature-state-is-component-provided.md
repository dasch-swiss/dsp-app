# ADR-0003: Feature state is component-provided, with one writer per value

- **Status:** Accepted (2026-09-13)
- **Relates to:** ADR-0001 (library taxonomy), ADR-0004 (cross-feature access)

## Context

Angular offers two places to provide a service: `providedIn: 'root'`, which creates one instance for the lifetime of the application, and a component's `providers:` array, which creates an instance scoped to that component and destroyed with it.

This codebase already uses the second, well, in its newest work and nowhere documents it. `libs/vre/pages/search/advanced-search/src/lib/providers.ts` collects the entire state of the advanced search feature into one function:

```ts
export function provideAdvancedSearch(): Provider[] {
  return [
    StatementDraftStore, OntologyDataService, DynamicFormsDataService,
    GravsearchService, ListNodeLabelResolver, SearchUrlSyncService,
    DerivedSearchStateService, SearchFlowLogger,
  ];
}
```

The page component declares it once. Every one of those eight services is created when the page opens and destroyed when it closes. `OntologyPageComponent` does the same thing inline with `providers: [OntologyPageService, OntologyEditService]`. There are forty-four component-level `providers:` arrays in the library tree, so the pattern is widespread rather than isolated.

The benefit is concrete and already being collected: no stale state when a page is revisited, no cross-page leakage, no growth in the root injector as features are added, and a feature's state graph readable in one file.

Where the codebase does not do this, the costs are visible and have been filed as defects:

- `ProjectPageService` (`pages/project/project`) and `AllProjectsService` (`pages/user-settings/user`) are `providedIn: 'root'` inside page libraries. Being root singletons is precisely why six and four other page libraries respectively import them: the instance is already there, so reaching for it costs nothing at the call site. Root provision inside a feature library is what makes cross-feature coupling cheap (ADR-0004).
- `KnoraApiConfig.jsonWebToken` is written from more than one place. After auto-login clears storage, an expired token continues to be sent (DEV-7249). This is a security defect whose direct cause is that no single component owns the value.
- The advanced search URL parameters have two sources of truth: `SearchUrlSyncService` is the designed write API, but four components also write parameters directly, with the parameter names repeated as string literals (DEV-7252).
- `MultipleViewerService`, `ResourceResultService`, `LocalizationService` and `OntologyEditService.latestChangedItem` each accept writes from more than one library.

The useful vocabulary here is **connascence** (Page-Jones, as popularised by Richards and Ford). Two components that must agree on a value's *name* are statically connascent, and a compiler or a rename refactor can keep them in step. Two components that must agree on *the identity of a mutable object*, which is what shared writable state is, are dynamically connascent: nothing checks the agreement, it cannot be found by searching, and it breaks at runtime in a component that did not change. Dynamic connascence of identity is the expensive kind, and it is the kind that `providedIn: 'root'` on a feature service creates by default.

## Decision

1. **A service that holds feature state is provided by the feature's component, not in the root injector.** (**review**)

   Feature state means anything whose correct lifetime is the page or the component: drafts, selections, the result of the query this page ran, form state, view mode. If the answer to "what should happen to this value when the user leaves the page?" is "it should be gone", it is feature state.

2. **A feature library groups its providers in a `provide<Feature>(): Provider[]` function exported from its barrel.** (**review**)

   `provideAdvancedSearch()` is the template. This keeps the feature's state graph in one reviewable file, makes the set greppable, and means a consumer adds one entry rather than eight. It also matches the `provideX()` convention Angular itself now uses.

3. **`providedIn: 'root'` is reserved for genuinely application-wide services**, which are, exhaustively:

   - configuration and route constants (`core/config`)
   - session, authentication and the current user (`core/session`)
   - error handling and error reporting (`core/error-handler`)
   - analytics (`3rd-party-services/analytics`)
   - the API clients and the `*ApiService` wrappers over them (`3rd-party-services/api`), which are stateless
   - user-interface utilities with no state of their own, such as the notification and dialog services

   **Route guards and resolvers are exempt.** Angular resolves them through the router, which needs them available at route level, so `providedIn: 'root'` is the idiomatic and correct form. `ProjectPageGuard` and `ProjectAdminGuard` in `pages/project` are not defects.

   A root-provided service **in a `type:feature` library** is otherwise a defect by default. It may still be correct, and if it is, the reason belongs in a comment at the `@Injectable` declaration. (**review**)

4. **One writer per value.** (**review**)

   Every piece of mutable state has exactly one component or service that writes it. Everyone else reads. Where a reader needs to cause a change, it calls a method on the owner rather than assigning to the value.

   This is the rule Redux calls "single source of truth" and that Angular architecture writing calls a facade. It is stated here in terms of writers rather than stores because the repository has no store library and this ADR does not introduce one.

5. **State that must outlive the component goes in the URL, not in a root service.** (**review**)

   Advanced search already does this: state is reconstructible from the URL alone, which is what makes a search shareable and bookmarkable. That is a product property, and it is a better answer to "this must survive navigation" than promoting a service to the root injector. Where the URL carries state, one service owns the writes to it (decision 4), which is the fix DEV-7252 describes.

## Consequences

**Positive.** Page state resets correctly without anybody writing reset logic, which is a class of bug that stops existing rather than being fixed. A feature's state graph is one file. Testing a feature means providing its `provide<Feature>()` function, not assembling the root injector. Dynamic connascence of identity stops being the default shape of new code.

**Negative and costs.** Two components that genuinely need to share state must have a common ancestor providing it, which occasionally forces a container component that would not otherwise exist. Contributors used to reaching for `providedIn: 'root'` have to think about lifetime, which is slower at the point of writing. The rule is `review`-enforced and not mechanically checkable: nothing in the toolchain will flag a root-provided service in a feature library, so it depends on reviewers knowing this ADR exists.

**The size of the backlog this creates, stated so the rule is not mistaken for describing the status quo.** Thirteen `providedIn: 'root'` declarations currently sit in libraries that ADR-0001 tags `type:feature`. Two are the route guards exempted above and one is an API service, which decision 3 also permits. That leaves ten to review, six of them in `resource-editor` (`geoname`, `math-jax`, `representation`, `segment-api`, `upload-file`, `open-sea-dragon`). Several will turn out to be correct: a MathJax loader is plausibly application-wide. The rule requires that the reason be written down, not that every one of them move.

**Interaction with Storybook.** Stories that mount a real container break when its injected dependencies change, and stories that mock it do not. `CLAUDE.md` already records this. Grouping providers behind `provide<Feature>()` reduces the blast radius, because a story stubs one function rather than tracking a list.

## Alternatives rejected

- **Keep `providedIn: 'root'` as the default and reset state manually on navigation.** This is the current behaviour in the libraries that have not adopted the pattern. It requires every service to implement correct teardown, gets it wrong silently, and has already produced DEV-7249.
- **Adopt NgRx, or any global store.** A single store makes ownership explicit and is a defensible choice for a different codebase. Here it would mean rewriting forty-four working component-provided provider sets to solve a problem those sets already solve, and it moves feature state back into an application-wide object, which is the shape decision 1 exists to avoid. Not warranted.
- **Adopt a signal store per feature (NgRx Signals or equivalent).** Closer to what the code already does and a reasonable future step, since `StatementDraftStore` is already store-shaped. Deferred: this ADR records the ownership rule, which is what the defects above actually violate. The choice of store library can be made later without contradicting it.
