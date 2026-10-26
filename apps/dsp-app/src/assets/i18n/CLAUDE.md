# Translation Guidelines for DSP-APP

This file provides guidance to Claude Code when working with translation files in this directory.

## Overview

This directory contains internationalization files for the DSP-APP application in JSON format:
- `en.json` - English (reference language)
- `de.json` - German
- `fr.json` - French  
- `it.json` - Italian

Romansh (`rm`) has no file of its own. It is bound to English at runtime by the fallback translation loader (`apps/dsp-app/src/app/i18n-fallback-translate-loader.ts`), so selecting Romansh in the UI serves `en.json`. See DEV-6629.

## Core Translation Rules

### 1. Key Parity Requirement
All translation files keep exact key parity with the English reference file (`en.json`).
Every key that exists in English must exist in all other language files.

### 2. English as Reference
- `en.json` is the authoritative reference for all translation keys
- Any changes to English keys must be immediately reflected in all other language files
- New keys should always be added to English first, then propagated to other languages
- If no translation is provided by PM for a new key, the English value should be used as a placeholder in the other language files

### 3. Romansh Policy
- Don't create `rm.json` or add Romansh translations unless real, PM-provided Romansh translations exist; doing so would reintroduce the duplicate file this setup removed (DEV-6629).
- When real translations do arrive, add `rm.json` and remove the `{ rm: 'en' }` entry from the fallback loader.

## Key Parity Verification

Verify key parity against `en.json` after any change. There is no script for this — run the check inline from the repository root (`json.load` also fails loudly on a syntax error, so this covers validation too):

```bash
python3 - <<'PY'
import json
def keys(o, p=''):
    s = set()
    for k, v in o.items():
        kp = f'{p}.{k}' if p else k
        s |= keys(v, kp) if isinstance(v, dict) else {kp}
    return s
ref = keys(json.load(open('apps/dsp-app/src/assets/i18n/en.json')))
for f in ['de', 'fr', 'it']:
    o = keys(json.load(open(f'apps/dsp-app/src/assets/i18n/{f}.json')))
    print(f, 'missing:', sorted(ref - o) or 'none', '| extra:', sorted(o - ref) or 'none')
PY
```

**Storybook caveat:** some libs render stories against a static translation object instead of `en.json` (e.g. `libs/vre/pages/search/search-filters/src/lib/stories.helpers.ts`). A new key used by a component that appears in those stories must be added there too, or the story renders the raw key. Parity checking `de`/`fr`/`it` will not catch it.

## Workflow for Translation Changes

### When Adding New Keys:
1. Add the key to `en.json` with the English text
2. Add proper translations to `de.json`, `fr.json`, and `it.json`
3. **Update the relevant code** to replace hardcoded text with the translation key (e.g., `"Cancel"` → `{{ 'ui.common.actions.cancel' | translate }}`)
4. Run the parity check (see **Key Parity Verification**)
5. Run the tests of each project whose templates you changed (`npx nx test <project>`), and `npm run test-storybook` if a changed component appears in stories (see the Storybook caveat above)

### When Updating Existing Keys:
1. Update the key in `en.json`
2. Update translations in other language files as needed
3. Run the parity check (see **Key Parity Verification**)

### When Removing Keys:
1. Remove from `en.json` first
2. Remove from all other language files (`de.json`, `fr.json`, `it.json`)
3. Verify no references remain in the codebase
4. Run the parity check (see **Key Parity Verification**)

## Testing Translations

After making translation changes, run the parity check (see **Key Parity Verification**); it is the gate. When a browser tool is available and the app is already running (`npm run start-local`), also switch languages in the UI and check that no key shows raw (e.g. `"pages.project.legalSettings.tab"`).

## Translation Structure

### Overview

The translation files follow a hierarchical structure with two main top-level sections:

1. **`pages.*`** - Feature-specific translations organized by page/module
2. **`ui.*`** - Reusable UI component translations

### `ui.common` Structure

`ui.common` holds the shared labels, so they are not duplicated per feature:

```
ui.common/
├── actions/          # Common action button labels (cancel, save, update, delete, etc.)
├── fields/           # Common form field labels (username, email, password, etc.)
├── errors/           # Common error messages
├── status/           # Status indicators (loading)
└── entities/         # Common entity names (user/users, project/projects, etc.)
```

### Decision Tree: `ui.common` vs `pages.*`

**Use `ui.common` when:**
- The text is used in 3+ different feature areas
- It's a standard action/field/status label
- The text is generic and context-independent

**Use `pages.*` when:**
- The text has business domain-specific context
- The text is unique to one feature
- The text includes feature-specific terminology

**Examples:**

✅ **Good:**
```typescript
'ui.common.actions.cancel'              // Generic action button
'ui.common.fields.username'             // Generic field label
'pages.search.advancedSearch.title'     // Feature-specific title
```

❌ **Bad:**
```typescript
'pages.search.cancel'                   // Don't duplicate common actions!
'pages.system.loading'                  // Don't duplicate common status labels!
```

### Key Referencing in Code

Keys use dot notation in the application code:

**Template usage (HTML):**
```html
<button mat-button>{{ 'ui.common.actions.cancel' | translate }}</button>
<mat-label>{{ 'ui.common.fields.username' | translate }}</mat-label>
```

**TypeScript usage:**
```typescript
const label = this._translateService.instant('ui.common.actions.cancel');
```

### File Structure Notes

Check `apps/dsp-app/src/assets/i18n/en.json` for the English reference file structure


## Translation Guidelines

Any translation created should follow these guidelines:

- Use a balanced tone that is professional yet approachable
- Keep translations concise while retaining meaning
- Follow domain terminology consistently, and prefer it over technical terminology
- Use inclusive language (e.g., "they" instead of "he/she")
- Use inclusive language in a discrete manner, avoiding awkward phrasing

For the different languages, follow these specific guidelines:

### English (en.json)

- Use British English spelling and grammar conventions

### German (de.json)

- Use Swiss High German conventions (Schweizer Hochdeutsch) over standard German where applicable (e.g., "Fussnoten" instead of "Fußnoten")
- Prefer gender-neutral terms where possible (e.g., "Admin" instead of "Administrator" or "Administratorin")
- Use combined gender forms where no neutral term exists (e.g., "Nutzer:innen" instead of "Nutzer" or "Nutzerinnen")
