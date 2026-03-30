# feat: Add Storybook as PO Source of Truth

**Date:** 2026-03-30
**Type:** Enhancement
**PRD:** `docs/prds/2026-03-30-storybook.md`
**Branch:** `julien/storybook`

---

## Problem Statement

DSP-DAS has no visual component catalogue. Product Owners must rely on developers to explain what has been built and whether acceptance criteria have been met. There is no executable, browsable source of truth that bridges the gap between PO requirements and implemented behaviour.

---

## Motivation

- PO can verify acceptance criteria visually without running the full app or reading code
- Interaction tests (`play()` functions) make acceptance criteria executable — they pass or fail in CI
- `argTypes` with descriptions turn component APIs into self-documenting living specs
- New developers have a canonical reference for expected component behaviour
- Pilot scope (3–5 components) keeps the initial investment low while proving the workflow

---

## Technical Approach

### Architecture Decision: Single root-level Storybook instance

Rather than one Storybook per library (which would require running multiple servers), configure a single Storybook at workspace root that scans story files across all `libs/vre/ui/` sub-libraries. This is the NX "one storybook for all" pattern — viable here because all libs use Angular.

The NX project is placed on `vre-ui-ui` (the main UI lib), with `stories` globs in `main.ts` extended to cover other `libs/vre/ui/*` libs as needed.

### Stack versions

| Package | Version | Notes |
|---|---|---|
| `@nx/storybook` | `~21.5.1` | Match NX workspace version |
| `@storybook/angular` | `^8.x` | NX 21.5 defaults to Storybook 8; upgrade to 9 is a follow-up |
| `@storybook/test` | `^8.x` | `play()` functions, `userEvent`, `expect`, `fn` |
| `@storybook/test-runner` | `^0.x` | Playwright-based CI runner for interaction tests |
| `@storybook/addon-essentials` | `^8.x` | Controls, Actions, Docs addons included |

> **Note:** NX 21.2+ defaults to Storybook 9 for new generators. Explicitly pin to Storybook 8 initially for stability; plan migration to Storybook 9 + `addon-vitest` as a follow-up.

### Theme wiring

Angular Material M2 theme is defined in `apps/dsp-app/src/styles.scss`. The Storybook builder must reference this file in its `styles` array and mirror `stylePreprocessorOptions.includePaths: ['apps/dsp-app/src/styles']` so SCSS partials (`_config.scss`, `_typography.scss`) resolve correctly.

### Provider wiring

Components use `provideAnimations()`, `provideHttpClient()`, and `provideTranslateService()` (ngx-translate v17+). These go in the global `applicationConfig` decorator in `.storybook/preview.ts`.

### CI strategy

Build static Storybook first, then serve with `http-server` and run `test-storybook` against it. This is more deterministic and cacheable than a dev server.

---

## Implementation Steps

### Step 1 — Install Storybook via NX generator

```bash
nx g @nx/angular:storybook-configuration vre-ui-ui \
  --interactionTests=true \
  --tsConfiguration=true \
  --linter=eslint \
  --no-generateStories
```

This creates:
- `libs/vre/ui/ui/.storybook/main.ts`
- `libs/vre/ui/ui/.storybook/preview.ts`
- Adds `storybook`, `build-storybook`, `test-storybook` targets to `libs/vre/ui/ui/project.json`

> The `browserTarget` must reference a valid Angular build target. Since `vre-ui-ui` has no `build` target, point it at `dsp-app:build` to inherit tsconfig and assets.

### Step 2 — Configure `main.ts`

```typescript
// libs/vre/ui/ui/.storybook/main.ts
import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(ts|mdx)',
    // Extend to cover other vre/ui libs:
    '../../../progress-indicator/src/**/*.stories.@(ts|mdx)',
    '../../../string-literal/src/**/*.stories.@(ts|mdx)',
  ],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  docs: { autodocs: false }, // Disable until compodoc integration is added
};

export default config;
```

### Step 3 — Configure `preview.ts`

```typescript
// libs/vre/ui/ui/.storybook/preview.ts
import { applicationConfig, type Preview } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

const preview: Preview = {
  decorators: [
    applicationConfig({
      providers: [
        provideAnimations(),
        provideHttpClient(),
        provideTranslateService({
          defaultLanguage: 'en',
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
            deps: [HttpClient],
          },
        }),
      ],
    }),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

### Step 4 — Configure `project.json` targets

```json
// libs/vre/ui/ui/project.json (relevant additions)
{
  "targets": {
    "storybook": {
      "executor": "@storybook/angular:start-storybook",
      "options": {
        "configDir": "libs/vre/ui/ui/.storybook",
        "browserTarget": "dsp-app:build",
        "compodoc": false,
        "port": 4400,
        "styles": ["apps/dsp-app/src/styles.scss"],
        "stylePreprocessorOptions": {
          "includePaths": ["apps/dsp-app/src/styles"]
        },
        "assets": [
          { "glob": "**/*", "input": "apps/dsp-app/src/assets", "output": "assets" }
        ]
      }
    },
    "build-storybook": {
      "executor": "@storybook/angular:build-storybook",
      "outputs": ["{options.outputDir}"],
      "options": {
        "configDir": "libs/vre/ui/ui/.storybook",
        "browserTarget": "dsp-app:build",
        "outputDir": "dist/storybook/vre-ui-ui",
        "styles": ["apps/dsp-app/src/styles.scss"],
        "stylePreprocessorOptions": {
          "includePaths": ["apps/dsp-app/src/styles"]
        },
        "assets": [
          { "glob": "**/*", "input": "apps/dsp-app/src/assets", "output": "assets" }
        ]
      },
      "configurations": {
        "ci": { "quiet": true }
      }
    },
    "test-storybook": {
      "executor": "nx:run-commands",
      "options": {
        "command": "test-storybook --url http://localhost:6006 --config-dir libs/vre/ui/ui/.storybook"
      }
    }
  }
}
```

### Step 5 — Write pilot stories

Write stories for 5 components in order of isolation (fewest deps first):

| Priority | Component | File | Notes |
|---|---|---|---|
| 1 | `AppProgressIndicatorComponent` | `app-progress-indicator.stories.ts` | No service deps, single `@Input() size` |
| 2 | `CenteredMessageComponent` | `centered-message.stories.ts` | 3 optional inputs, only `MatIconModule` |
| 3 | `DoubleChipSelectorComponent` | `double-chip-selector.stories.ts` | Boolean toggle, 2 inputs, no services |
| 4 | `CommonInputComponent` | `common-input.stories.ts` | Needs `FormControl` constructed in story |
| 5 | `PagerComponent` | `pager.stories.ts` | Needs translate provider (already in global decorator) |

**Story template pattern** (CSF3):

```typescript
// app-progress-indicator.stories.ts
import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from '@storybook/test';
import { AppProgressIndicatorComponent } from './app-progress-indicator.component';

const meta: Meta<AppProgressIndicatorComponent> = {
  title: 'UI / Progress Indicator / Spinner',
  component: AppProgressIndicatorComponent,
  argTypes: {
    size: {
      description: 'Controls the diameter of the spinner. Use "sm" for inline contexts, "lg" for full-page loading states.',
      control: 'select',
      options: ['sm', 'md', 'lg'],
      table: {
        type: { summary: "'sm' | 'md' | 'lg'" },
        defaultValue: { summary: 'md' },
        category: 'Appearance',
      },
    },
  },
};
export default meta;
type Story = StoryObj<AppProgressIndicatorComponent>;

export const Default: Story = {
  storyName: 'Shows spinner at default (medium) size',
  args: { size: 'md' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('progressbar')).toBeInTheDocument();
  },
};

export const LargeSize: Story = {
  storyName: 'Shows larger spinner for full-page loading states',
  args: { size: 'lg' },
};
```

### Step 6 — Add `test-storybook` to CI

Add a new job to `.github/workflows/ci.yml`:

```yaml
storybook-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 22.12.0
        cache: 'npm'
    - run: npm ci
    - name: Build Storybook
      run: nx run vre-ui-ui:build-storybook:ci
    - name: Install Playwright browsers
      run: npx playwright install --with-deps chromium
    - name: Serve and test
      run: |
        npx http-server dist/storybook/vre-ui-ui --port 6006 --silent &
        npx wait-on tcp:6006 --timeout 60000
        nx run vre-ui-ui:test-storybook -- --maxWorkers=2
```

### Step 7 — Add story naming convention to CLAUDE.md

Document the naming convention so all developers follow it:

```
Stories must follow the title format: `Feature Area / Component / Scenario`
Story export names encode acceptance criteria in plain language:
  e.g. `ShowsErrorWhenRequiredFieldIsEmpty`, `DisablesSubmitWhileLoading`
```

---

## Dependencies

- `@nx/storybook ~21.5.1`
- `@storybook/angular ^8.x`
- `@storybook/test ^8.x`
- `@storybook/addon-essentials ^8.x`
- `@storybook/addon-interactions ^8.x`
- `@storybook/test-runner ^0.x`
- `http-server` (devDependency, for CI static serving)
- `wait-on` (devDependency, for CI port polling)

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| `browserTarget` fails for non-buildable lib | Medium | Point `browserTarget` at `dsp-app:build`; inherit its tsconfig/assets |
| Angular Material SCSS theme not applied in Storybook | Medium | Explicitly set `styles` + `stylePreprocessorOptions.includePaths` in executor options |
| Translation strings missing (blank labels for PO) | Low | Reference actual translation JSON via `assets` config in executor; use `provideTranslateService` with HTTP loader |
| NX generator defaults to Storybook 9 | Medium | Explicitly install `@storybook/angular@^8` before running generator; pin version in package.json |
| CI times out on Playwright | Low | Set `--maxWorkers=2` on `test-storybook` in resource-constrained CI environment |
| `experimentalZoneless` API removed in Angular 20 | Low | Ensure Storybook 8 patch is up-to-date (`npx storybook@^8 upgrade`) |

---

## Open Questions

1. **Which Angular build target for `browserTarget`?** Confirm `dsp-app:build` is the right target to borrow tsconfig/assets from, or create a minimal dedicated build target on the lib.
2. **Single Storybook instance vs per-lib?** Plan uses single instance under `vre-ui-ui`. If teams want isolated lib Storebooks later, each lib can run the generator independently.
3. **Compodoc integration?** Disabled in this plan for simplicity. Enable as follow-up to auto-generate `argTypes` descriptions from JSDoc on `@Input()`/`@Output()`.
4. **Storybook 9 migration timeline?** NX 21.2 pushes Storybook 9. Plan now for migration once pilot proves the pattern.

---

## Success Metrics

1. `nx run vre-ui-ui:storybook` starts locally without errors
2. 5 pilot components have at least one `play()` story with a passing interaction test
3. `nx run vre-ui-ui:test-storybook` exits 0 in CI
4. PO reviews pilot Storybook and confirms it is sufficient to verify acceptance criteria
5. At least one other developer writes a story following the convention without help

---

## Out of Scope

- Storybook deployment / hosting (Chromatic, GitHub Pages, self-hosted) — separate initiative
- Visual regression / screenshot diffing
- Accessibility addon (`@storybook/addon-a11y`)
- Full component coverage (follow-up)
- Compodoc auto-docs (follow-up)
- Migration of existing Jest/Cypress tests
