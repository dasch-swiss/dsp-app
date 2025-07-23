import { registerLocaleData } from '@angular/common';
import de_CH from '@angular/common/locales/de-CH';
import en_GB from '@angular/common/locales/en-GB';
import fr_CH from '@angular/common/locales/fr-CH';
import it_CH from '@angular/common/locales/it-CH';
import { Injectable } from '@angular/core';
import { AvailableLanguages, LocalStorageLanguageKey } from '@dasch-swiss/vre/core/config';
import { TranslateService } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocalizationService {
  private readonly defaultLanguage = 'en';

  private _locale: any;
  set locale(value: string) {
    this._locale = value;
    this.setLocale(this._locale);
  }

  availableLocales = [
    { locale: 'en-GB', localeData: en_GB },
    { locale: 'fr-CH', localeData: fr_CH },
    { locale: 'de-CH', localeData: de_CH },
    { locale: 'it-CH', localeData: it_CH },
  ];

  constructor(private translateService: TranslateService) {}

  init() {
    this.setDefaultLanguage();
    this.locale = 'en-GB';
  }

  getCurrentLanguage(): string {
    return this.translateService.currentLang ? this.translateService.currentLang : this.getLanguage();
  }

  currentLanguage$ = this.translateService.onLangChange.pipe(
    map(event => event.lang),
    startWith(this.getCurrentLanguage())
  );

  setLanguage(language: string) {
    this.translateService.use(language);
    this.saveLanguageToLocalStorage(language);
  }

  private saveLanguageToLocalStorage(language: string) {
    localStorage.setItem(LocalStorageLanguageKey, JSON.stringify(language));
  }

  private getLanguage(): string {
    const key = localStorage.getItem(LocalStorageLanguageKey);
    return key ? JSON.parse(key) : this.getLanguageFromBrowser();
  }

  private getLanguageFromBrowser(): string {
    const browserLang = this.translateService.getBrowserLang();
    const availableLanguageExp = AvailableLanguages.map(lang => lang.language).join('|');
    return browserLang?.match(`/${availableLanguageExp}/`) ? browserLang : this.defaultLanguage;
  }

  private setDefaultLanguage() {
    this.setLanguage(this.getLanguage());
  }

  private setLocale(locale: string) {
    let localeItem = this.availableLocales.find(item => item.locale === locale);

    if (!localeItem) {
      localeItem = { locale: 'en', localeData: en_GB };
    }

    registerLocaleData(localeItem.localeData, locale);
    document.documentElement.lang = (localeItem.localeData[0] as string).substr(0, 2);
  }
}
