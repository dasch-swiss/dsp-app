# PRD — Global Storybook Instance

**Date:** 2026-04-13  
**Status:** Approved  

## Context

The monorepo has a root-level `.storybook/` config that currently hardcodes 3 story glob paths
(`libs/vre/ui/ui`, `libs/vre/ui/progress-indicator`, `libs/vre/pages/user-settings/user`).
The NX `storybook`, `build-storybook`, `test-storybook`, and `static-storybook` targets all live
on the `vre-ui-ui` library project.

As new libs add stories, developers must manually register paths in both `.storybook/main.ts` and
`.storybook/tsconfig.json`. This is fragile, error-prone, and does not scale.

## Goal

A single global Storybook instance that:
- Auto-discovers all `*.stories.ts` / `*.stories.mdx` files across the entire monorepo
- Is not coupled to any specific NX library
- Can be started with one command so stakeholders can view all component stories in one place

## Core Features

### 1. Wildcard story discovery in `.storybook/main.ts`
Replace the 3 hardcoded globs with:
```ts
stories: [
  '../libs/**/*.stories.@(ts|mdx)',
  '../apps/**/*.stories.@(ts|mdx)',
]
```

### 2. Wildcard includes in `.storybook/tsconfig.json`
Replace hardcoded file includes with:
```json
"include": [
  "../libs/**/*.stories.ts",
  "../apps/**/*.stories.ts",
  "../apps/dsp-app/src/polyfills.ts",
  "*.js",
  "*.ts"
]
```

### 3. Move NX targets to root project
Remove `storybook`, `build-storybook`, `test-storybook`, `static-storybook` targets from
`libs/vre/ui/ui/project.json` and place them in a root-level NX project so they are not
tied to any single library.

### 4. Top-level npm scripts
Add convenience scripts to `package.json`:
```json
"storybook": "nx run storybook:storybook",
"build-storybook": "nx run storybook:build-storybook",
"test-storybook": "nx run storybook:test-storybook"
```

## Constraints

- Must reuse the existing root `.storybook/` config (no new config directory)
- Must preserve existing `preview.ts` setup (providers, animations, translations)
- Existing `ci` configurations on the NX targets must be preserved
- No per-lib isolated Storybook configs introduced

## Out of Scope

- CI/CD pipeline changes
- Per-lib isolated Storybook development configs
- Chromatic or other visual regression tooling
- Compodoc integration

## Success Criteria

- `npm run storybook` (or equivalent NX command) starts a single server
- All existing stories are visible without any manual registration
- Adding a new `*.stories.ts` file to any lib is automatically picked up — no config change required

## Open Questions

- Should `apps/**` stories also be included, or `libs/**` only for now?
