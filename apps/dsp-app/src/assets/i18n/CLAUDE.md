# Translation Guidelines for DSP-APP

This file provides guidance to Claude Code when working with translation files in this directory.

## Overview

This directory contains internationalization files for the DSP-APP application in JSON format:
- `en.json` - English (reference language)
- `de.json` - German
- `fr.json` - French  
- `it.json` - Italian
- `rm.json` - Romansh

## Core Translation Rules

### 1. Key Parity Requirement
**CRITICAL**: All translation files MUST maintain exact key parity with the English reference file (`en.json`). 
Every key that exists in English must exist in all other language files.

### 2. English as Reference
- `en.json` is the authoritative reference for all translation keys
- Any changes to English keys must be immediately reflected in all other language files
- New keys should always be added to English first, then propagated to other languages
- If no translation is provided by PM for a new key, the English value should be used as a placeholder in the other language files

### 3. Romansh Translation Policy
**IMPORTANT**: For Romansh (`rm.json`) translations:
- **DO NOT** suggest or create Romansh translations unless explicitly instructed
- **ALWAYS** use English values as placeholders for missing or new keys
- When English is updated, immediately update `rm.json` with the same English values
- This ensures functionality remains intact while proper Romansh translations are handled separately

### 4. Translation Consistency
- Maintain consistent terminology across all languages
- When updating translations, ensure the meaning and tone remain consistent
- Consider context and user experience when shortening or modifying text

## Key Parity Verification

Use this Python script to verify that all translation files have matching keys:

```python
#!/usr/bin/env python3
import json
from pathlib import Path

def extract_keys(obj, prefix=""):
    keys = set()
    for key, value in obj.items():
        full_key = f"{prefix}.{key}" if prefix else key
        keys.add(full_key)
        if isinstance(value, dict):
            keys.update(extract_keys(value, full_key))
    return keys

def check_parity():
    languages = ['en', 'de', 'fr', 'it', 'rm']
    all_keys = {}
    
    for lang in languages:
        with open(f"{lang}.json", encoding='utf-8') as f:
            all_keys[lang] = extract_keys(json.load(f))
    
    reference_keys = all_keys['en']
    print(f"English: {len(reference_keys)} keys")
    
    errors = []
    for lang in ['de', 'fr', 'it', 'rm']:
        lang_keys = all_keys[lang]
        missing = reference_keys - lang_keys
        extra = lang_keys - reference_keys
        
        print(f"{lang.upper()}: {len(lang_keys)} keys")
        if missing: errors.append(f"Missing in {lang}: {sorted(missing)}")
        if extra: errors.append(f"Extra in {lang}: {sorted(extra)}")
    
    if errors:
        print("❌ Issues found:")
        for error in errors: print(f"  {error}")
    else:
        print("✅ All files have matching keys!")

if __name__ == "__main__":
    check_parity()
```

### Usage
```bash
# Save the script as check_parity.py in the i18n directory, then run:
python3 check_parity.py

# For Claude Code: Copy the script above and run with single quotes to avoid escape issues:
cd <i18n_directory_path> && python3 -c '<paste_script_here_with_single_quotes>'
```

## Workflow for Translation Changes

### When Adding New Keys:
1. Add the key to `en.json` with the English text
2. Add the same key to `rm.json` using the English value
3. Add proper translations to `de.json`, `fr.json`, and `it.json`
4. **Update the relevant code** to replace hardcoded text with the translation key (e.g., `"Add user"` → `{{ 'pages.project.add' | translate }}`)
5. Run the parity verification script
6. Test the application to ensure functionality

### When Updating Existing Keys:
1. Update the key in `en.json`
2. Update the same key in `rm.json` with the new English value
3. Update translations in other language files as needed
4. Run the parity verification script
5. Test the application

### When Removing Keys:
1. Remove from `en.json` first
2. Remove from all other language files (`de.json`, `fr.json`, `it.json`, `rm.json`)
3. Verify no references remain in the codebase
4. Run the parity verification script

## Common Issues to Avoid

1. **Partial Updates**: Never update only some language files - always maintain parity
2. **Key Typos**: Double-check key names when copying between files

## Testing Translations

After making translation changes:
1. Run the parity verification script
2. Start the application: `npm run start-local`
3. Switch between languages in the UI to verify functionality
4. Check that no translation keys show as raw keys (e.g., `"pages.project.legalSettings.tab"`)

## File Structure Notes

check @dasch-swiss/dsp-app/apps/dsp-app/src/assets/i18n/en.json for the English reference file structure.

When referencing keys in the application code, they use dot notation: `pages.project.legalSettings.tab`
