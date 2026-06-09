import { Injectable } from '@angular/core';
import { AvailableLanguage, AvailableLanguageKeys, LocalStorageLanguageKey } from '@dasch-swiss/vre/core/config';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocalizationService {
  private readonly _defaultLanguage: AvailableLanguage = 'en';

  private readonly _currentLanguage$ = new BehaviorSubject<AvailableLanguage>(this._defaultLanguage);
  readonly currentLanguage$ = this._currentLanguage$.asObservable();

  private get _localStorageLanguage(): string | undefined {
    const raw = localStorage.getItem(LocalStorageLanguageKey);
    if (raw === null) return undefined;
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'string' ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  constructor(private readonly _translateService: TranslateService) {}

  init() {
    const preferredLanguage = this._localStorageLanguage
      ? this._localStorageLanguage
      : this._translateService.getBrowserLang();

    const initialLanguage =
      preferredLanguage && AvailableLanguageKeys.includes(preferredLanguage as AvailableLanguage)
        ? (preferredLanguage as AvailableLanguage)
        : this._defaultLanguage;
    this.currentLanguage = initialLanguage;
  }

  get currentLanguage(): AvailableLanguage {
    return this._currentLanguage$.getValue();
  }

  set currentLanguage(language: AvailableLanguage) {
    localStorage.setItem(LocalStorageLanguageKey, JSON.stringify(language));
    this._currentLanguage$.next(language);
    this._translateService.use(language);
  }

  static parseLanguage(value: string | undefined | null): AvailableLanguage | undefined {
    return value && AvailableLanguageKeys.includes(value as AvailableLanguage)
      ? (value as AvailableLanguage)
      : undefined;
  }
}
