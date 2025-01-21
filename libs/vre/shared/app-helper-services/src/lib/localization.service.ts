import { registerLocaleData } from '@angular/common';
import de_CH from '@angular/common/locales/de-CH';
import en_GB from '@angular/common/locales/en-GB';
import fr_CH from '@angular/common/locales/fr-CH';
import it_CH from '@angular/common/locales/it-CH';
import { Injectable } from '@angular/core';
import { AvailableLanguages } from '@dasch-swiss/vre/core/config';
import { TranslateService } from '@ngx-translate/core';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class LocalizationService extends BaseService {
  private readonly defaultLanguage = 'en';
  private readonly localStorageLanguageKey = 'dsp_language';

  private _locale: any;
  get locale() {
    return window.navigator.language ? window.navigator.language : this._locale;
  }

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

  constructor(private translateService: TranslateService) {
    super();
  }

  init() {
    this.setDefaultLanguage();
    this.locale = 'en-GB';
  }

  getCurrentLanguage(): string {
    return this.translateService.currentLang ? this.translateService.currentLang : this.getLanguage();
  }

  setLanguage(language: string) {
    this.translateService.use(language);
    this.saveLanguageToLocalStorage(language);
  }

  private saveLanguageToLocalStorage(language: string) {
    localStorage.setItem(this.localStorageLanguageKey, JSON.stringify(language));
  }

  private getLanguage(): string {
    const key = localStorage.getItem(this.localStorageLanguageKey);
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
