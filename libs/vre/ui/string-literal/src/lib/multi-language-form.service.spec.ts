import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AvailableLanguage, AvailableLanguageKeys } from '@dasch-swiss/vre/core/config';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { MultiLanguageFormArray } from './multi-language-form-array.type';
import { MultiLanguageFormService } from './multi-language-form.service';

describe('MultiLanguageFormService._setupLanguageIndex', () => {
  let service: MultiLanguageFormService;
  let localization: { currentLanguage: AvailableLanguage };
  const fb = new FormBuilder();
  const cd = { detectChanges: jest.fn() } as unknown as ChangeDetectorRef;

  function buildFormArray(entries: Array<{ language: AvailableLanguage; value: string }>): MultiLanguageFormArray {
    return fb.array(
      entries.map(e =>
        fb.nonNullable.group({
          language: e.language as AvailableLanguage,
          value: e.value,
        })
      )
    ) as unknown as MultiLanguageFormArray;
  }

  beforeEach(() => {
    localization = { currentLanguage: 'en' };
    service = new MultiLanguageFormService(localization as LocalizationService, fb, cd);
  });

  it('picks the current language when the form has a non-empty value for it', () => {
    localization.currentLanguage = 'de';
    const formArray = buildFormArray([
      { language: 'en', value: 'Hello' },
      { language: 'de', value: 'Hallo' },
    ]);

    service.onInit(formArray, []);

    expect(service.selectedLanguageIndex).toBe(AvailableLanguageKeys.indexOf('de'));
  });

  it('falls back to the first available language with a value when the current language is empty', () => {
    localization.currentLanguage = 'fr';
    const formArray = buildFormArray([
      { language: 'de', value: 'Hallo' },
      { language: 'en', value: 'Hello' },
    ]);

    service.onInit(formArray, []);

    // AvailableLanguageKeys order is ['en', 'de', 'fr', 'it', 'rm'] → first hit is 'en'.
    expect(service.selectedLanguageIndex).toBe(AvailableLanguageKeys.indexOf('en'));
  });

  it('defaults to the current language index when the form is empty (create flow)', () => {
    localization.currentLanguage = 'it';
    const formArray = buildFormArray([]);

    service.onInit(formArray, []);

    expect(service.selectedLanguageIndex).toBe(AvailableLanguageKeys.indexOf('it'));
  });

  it('defaults to index 0 when the current language is not in the available list', () => {
    localization.currentLanguage = 'xx' as AvailableLanguage;
    const formArray = buildFormArray([]);

    service.onInit(formArray, []);

    expect(service.selectedLanguageIndex).toBe(0);
  });
});
