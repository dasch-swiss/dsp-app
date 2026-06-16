import { Pipe, PipeTransform } from '@angular/core';
import { StringLiteral } from '@dasch-swiss/dsp-js';
import { LanguageStringDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AvailableLanguage } from '@dasch-swiss/vre/core/config';
import { LocalizationService, pickPreferredLanguageString } from '@dasch-swiss/vre/shared/app-helper-services';

type LabelInput = StringLiteral[] | LanguageStringDto[] | null | undefined;

/**
 * Resolves a multi-language label to a single string using the current
 * UI language, with fallback to the first non-empty value.
 *
 * Impure so the displayed label updates on language change without the
 * input array reference changing. To keep impurity cheap inside @for
 * loops (the pipe is called once per change-detection cycle per usage),
 * the last (input, language) result is memoized — repeat calls with the
 * same inputs return immediately without re-running pickPreferredLanguageString.
 *
 * Language is read from LocalizationService — the single gate-keeper of
 * the current language. Do not introduce TranslateService here.
 */
@Pipe({
  name: 'appStringifyStringLiteral',
  pure: false,
})
export class StringifyStringLiteralPipe implements PipeTransform {
  private _lastValue: LabelInput;
  private _lastLanguage: AvailableLanguage | undefined;
  private _lastResult = '';
  private _hasResult = false;

  constructor(private readonly _localizationService: LocalizationService) {}

  transform(value: LabelInput): string {
    const language = this._localizationService.currentLanguage;
    if (this._hasResult && this._lastValue === value && this._lastLanguage === language) {
      return this._lastResult;
    }
    const result = pickPreferredLanguageString(value, language);
    this._lastValue = value;
    this._lastLanguage = language;
    this._lastResult = result;
    this._hasResult = true;
    return result;
  }
}
