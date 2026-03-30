# PRD: Storybook as PO Source of Truth

**Date:** 2026-03-30
**Status:** Draft

---

## Context

DSP-DAS is a mature Angular/NX monorepo with no existing Storybook setup. The PO needs a visual, shareable source of truth to verify that features meet acceptance criteria without reading code or running the app. Developers need a workflow where component behaviour is documented, testable, and reviewable independently of the full app.

---

## Goals

1. Install and configure Storybook for the Angular/NX monorepo
2. Establish a convention where stories act as living acceptance criteria — each story documents a component state or behaviour the PO can visually verify
3. Interaction tests (`play()` functions) make acceptance criteria executable and runnable in CI
4. Component API contracts are documented via args/controls, so the PO can explore variations without dev involvement
5. A pilot set of 3–5 shared UI components demonstrates the pattern for the rest of the team

---

## Core Features

1. **Storybook installation** — `@storybook/angular` configured for the NX monorepo, with a root `.storybook/` config that works across all libs
2. **Story convention** — each story maps to a user-visible state or behaviour (not just a prop variant); story titles follow a `Feature / Component / Scenario` naming pattern so the PO can navigate by feature
3. **Interaction tests** — `play()` functions using `@storybook/test` simulate user actions (clicks, form input) and assert outcomes; these run in the Storybook UI and in CI via `test-storybook`
4. **Controls as API spec** — args and argTypes are explicitly defined with descriptions, so the PO can tweak inputs and see live results
5. **Pilot stories** — 3–5 components from `libs/vre/ui/` covered first to validate the setup
6. **CI integration** — `test-storybook` runs interaction tests in the existing CI pipeline alongside Jest and Cypress

---

## User Stories

1. **As a PO**, I can open Storybook and browse components organised by feature, so I can verify that each acceptance criterion is visually met without running the app.
2. **As a PO**, I can use controls to explore component variations (e.g. empty state, error state, loaded state), so I understand the full behaviour without asking a developer.
3. **As a developer**, I write a story + `play()` function for each acceptance criterion, so the PO has a living, executable spec to review.
4. **As a developer**, I run `test-storybook` locally and in CI to verify all interaction tests pass before merging.
5. **As a tech lead**, I can point new developers to Storybook as the canonical reference for how each component is expected to behave.

---

## Acceptance Criteria

1. `nx run dsp-app:storybook` starts Storybook locally without errors
2. Every pilot story has at least one `play()` function that asserts a user-visible outcome
3. `nx run dsp-app:test-storybook` runs all interaction tests and exits with a non-zero code on failure
4. CI pipeline runs `test-storybook` and blocks merge on failure
5. Story titles follow the `Feature / Component / Scenario` convention (enforced via a linting rule or documented convention)
6. Each story's args/argTypes include a `description` field for every prop
7. The PO can navigate the full pilot set of stories in a running Storybook without requiring any local setup

---

## Constraints

1. **NX monorepo** — Storybook must integrate with NX executors (`@nx/storybook`), not bypass the build system
2. **Angular** — must use `@storybook/angular`; no React or framework mixing
3. **MUI components** — stories must render MUI components correctly, which requires theme providers in the Storybook decorator
4. **No new test framework** — interaction tests use `@storybook/test` (already Storybook-native); Jest and Cypress remain unchanged
5. **CI budget** — `test-storybook` must run within the existing CI time budget; pilot scope (3–5 components) keeps this manageable initially

---

## Out of Scope

1. **Deployment / hosting** — where PO accesses Storybook remotely is a separate decision (Chromatic, GitHub Pages, self-hosted)
2. **Visual regression testing** — screenshot diffing (e.g. Chromatic, Percy) not included in this initiative
3. **Accessibility testing** — `@storybook/addon-a11y` not included initially
4. **Full component library coverage** — only 3–5 pilot components; remaining components are follow-up work
5. **Story authoring by PO** — PO reviews stories, does not write them
6. **Migration of existing Jest/Cypress tests** — existing tests stay as-is; stories are additive

---

## Success Criteria

1. At least 3 pilot components have stories with passing `play()` interaction tests
2. `test-storybook` runs green in CI on the first PR that introduces stories
3. PO has reviewed the pilot Storybook and confirmed it gives them enough visibility to sign off on acceptance criteria
4. At least one developer (other than the author) has written a story following the established convention without needing help

---

## Open Questions

1. **Which 3–5 pilot components** should be covered first — shared UI primitives (buttons, inputs) or higher-level feature components that the PO cares about most?
2. **NX project placement** — should Storybook run under the `dsp-app` project or as a dedicated `storybook` app in the NX workspace?
3. **Theme/provider setup** — which Angular modules and MUI theme providers need to be included in the global Storybook decorator to render components correctly?
4. **CI runner** — does `test-storybook` run against a built static Storybook or a live dev server in CI?
