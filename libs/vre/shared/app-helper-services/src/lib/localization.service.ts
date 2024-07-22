import { registerLocaleData } from '@angular/common';
import de_CH from '@angular/common/locales/de-CH';
import en from '@angular/common/locales/en';
import fr_CH from '@angular/common/locales/fr-CH';
import it_CH from '@angular/common/locales/it-CH';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BaseService } from './base.service';

export interface ILanguage {
  name: string;
  value: string;
}

@Injectable({
  providedIn: 'root',
})
export class LocalizationService extends BaseService {
  private readonly defaultLanguage = 'en';
  private readonly localStorageLanguageKey = 'dsp_language';

  private readonly languageDe: ILanguage = { name: 'German (Deutsch)', value: 'de' };
  private readonly languageFr: ILanguage = { name: 'French (Francais)', value: 'fr' };
  private readonly languageIt: ILanguage = { name: 'Italian (Italiano)', value: 'it' };

  private _availableLanguages: ILanguage[] = new Array<ILanguage>();
  get availableLanguages(): ILanguage[] {
    return this._availableLanguages ? this._availableLanguages : new Array<ILanguage>();
  }

  private _locale: any;
  get locale() {
    return window['prerender'] ? window['prerender']['locale'] : this._locale;
  }

  set locale(value: string) {
    this._locale = value;
    this.setLocale(this._locale);
  }

  availableLocales = [
    { locale: 'en', localeData: en },
    { locale: 'fr-CH', localeData: fr_CH },
    { locale: 'de-CH', localeData: de_CH },
    { locale: 'it-CH', localeData: it_CH },
  ];

  constructor(private translateService: TranslateService) {
    super();
    this.createAvailableLanguages();
  }

  init() {
    this.setDefaultLanguage();
    this.locale = 'en';
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
    return browserLang?.match(/en|de|fr|it/) ? browserLang : this.defaultLanguage;
  }

  private setDefaultLanguage() {
    this.setLanguage(this.getLanguage());
  }

  private createAvailableLanguages() {
    this._availableLanguages = new Array<ILanguage>();
    this.availableLanguages.push(this.languageDe);
    this.availableLanguages.push(this.languageFr);
    this.availableLanguages.push(this.languageIt);
  }

  private setLocale(locale: string) {
    let localeItem = this.availableLocales.find(item => item.locale === locale);

    if (!localeItem) {
      localeItem = { locale: 'en', localeData: en };
    }

    registerLocaleData(localeItem.localeData, locale);
    document.documentElement.lang = (localeItem.localeData[0] as string).substr(0, 2);
  }
}
