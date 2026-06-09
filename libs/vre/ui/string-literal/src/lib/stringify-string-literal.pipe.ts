import { Pipe, PipeTransform } from '@angular/core';
import { StringLiteral } from '@dasch-swiss/dsp-js';
import { LanguageStringDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { LocalizationService, pickPreferredLabel } from '@dasch-swiss/vre/shared/app-helper-services';

/**
 * Resolves a multi-language label to a single string using the current
 * UI language, with fallback to the first non-empty value.
 *
 * Impure so the displayed label updates on language change. The work
 * (two Array.find calls on a 1-5 element array) is cheap enough that
 * running it on every change-detection cycle is fine.
 *
 * Language is read from LocalizationService — the single gate-keeper of
 * the current language. Do not introduce TranslateService here.
 */
@Pipe({
  name: 'appStringifyStringLiteral',
  pure: false,
})
export class StringifyStringLiteralPipe implements PipeTransform {
  constructor(private readonly _localizationService: LocalizationService) {}

  transform(value: StringLiteral[] | LanguageStringDto[] | null | undefined): string {
    return pickPreferredLabel(value, this._localizationService.currentLanguage);
  }
}
