import { Injectable } from '@angular/core';
import { AvailableLanguage, AvailableLanguageKeys, LocalStorageLanguageKey } from '@dasch-swiss/vre/core/config';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocalizationService {
  private readonly _defaultLanguage: AvailableLanguage = 'en';

  currentLanguage$ = this._translateService.onLangChange.pipe(map(event => event.lang));

  private get _localStorageLanguage(): string | undefined {
    const key = localStorage.getItem(LocalStorageLanguageKey);
    return key ? JSON.parse(key) : undefined;
  }

  constructor(private readonly _translateService: TranslateService) {}

  init() {
    const preferredLanguage = this._localStorageLanguage
      ? this._localStorageLanguage
      : this._translateService.getBrowserLang();

    const initialLanguage =
      preferredLanguage && AvailableLanguageKeys.includes(preferredLanguage as AvailableLanguage)
        ? preferredLanguage
        : this._defaultLanguage;
    this.currentLanguage = initialLanguage;
  }

  get currentLanguage(): string {
    return this._translateService.getCurrentLang();
  }

  set currentLanguage(language: string) {
    this._translateService.use(language);
    localStorage.setItem(LocalStorageLanguageKey, JSON.stringify(language));
  }
}
