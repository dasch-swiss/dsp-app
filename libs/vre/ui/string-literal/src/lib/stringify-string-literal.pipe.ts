import { Pipe, PipeTransform } from '@angular/core';
import { StringLiteral } from '@dasch-swiss/dsp-js';
import { LanguageStringDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';

@Pipe({
  name: 'appStringifyStringLiteral',
})
export class StringifyStringLiteralPipe implements PipeTransform {
  constructor(private readonly _localizationService: LocalizationService) {}

  transform(value: StringLiteral[] | LanguageStringDto[] | null | undefined): string {
    if (!value || !value.length) return '';

    const byCurrentLanguage = value.find(l => l.language === this._localizationService.currentLanguage)?.value;
    if (byCurrentLanguage) return byCurrentLanguage;

    // If no value is found for the current language, return the first non-empty value in any language
    const firstNonEmpty = value.find(l => l.value && l.value.trim() !== '')?.value;
    return firstNonEmpty ?? '';
  }
}
