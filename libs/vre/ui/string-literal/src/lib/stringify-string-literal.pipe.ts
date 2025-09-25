import { Pipe, PipeTransform } from '@angular/core';
import { StringLiteral } from '@dasch-swiss/dsp-js';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';

@Pipe({
  name: 'appStringifyStringLiteral',
  standalone: false,
})
export class StringifyStringLiteralPipe implements PipeTransform {
  constructor(private localizationService: LocalizationService) {}

  transform(value: StringLiteral[], allAsString = false): string {
    if (!value || value.length === 0) {
      return '';
    }
    if (allAsString) {
      return value.map(sl => `${sl.value} (${sl.language})`).join(' / ');
    }

    const userPreferedLanguage = this.localizationService.getCurrentLanguage();
    // passed preferred language
    let translation = value.find(i => i.language === userPreferedLanguage)?.value;
    if (!translation) {
      // if the string literal is not translated in the user preferred language
      translation = value.find(i => i.language === this.localizationService.getLanguageFromBrowser())?.value;
    }
    return translation || value[0].value; // fallback to the first value in the array
  }
}
