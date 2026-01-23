import { Pipe, PipeTransform } from '@angular/core';
import { StringLiteral } from '@dasch-swiss/dsp-js';
import { LanguageStringDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';

@Pipe({
  name: 'appStringifyStringLiteral',
})
export class StringifyStringLiteralPipe implements PipeTransform {
  constructor(private readonly _localizationService: LocalizationService) {}

  transform(value: StringLiteral[] | LanguageStringDto[]): string {
    if (!value || value.length === 0) {
      return '';
    }

    const userPreferedLanguage = this._localizationService.getCurrentLanguage();
    // passed preferred language
    let translation = value.find(i => i.language === userPreferedLanguage)?.value;
    if (!translation) {
      // if the string literal is not translated in the user preferred language
      translation = value.find(i => i.language === this._localizationService.getLanguageFromBrowser())?.value;
    }
    return translation || value[0].value; // fallback to the first value in the array
  }
}
