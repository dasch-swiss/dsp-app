// Exposed via the `@dasch-swiss/vre/shared/app-helper-services/testing` secondary
// entry point so spec files in other libraries can import it without polluting the
// production barrel. The lib's production tsconfig has `types: []`, so this
// reference lets the file type-check during the lib build.
/// <reference types="jest" />
import { AvailableLanguage } from '@dasch-swiss/vre/core/config';
import { BehaviorSubject, Observable } from 'rxjs';
import { LocalizationService } from './localization.service';

/**
 * Returns a `Partial<LocalizationService>` suitable for `useValue` in a TestBed
 * provider, together with a jest spy that captures setter calls.
 *
 * Replaces the boilerplate `mockLocalizationService = {} as any` +
 * `Object.defineProperty(..., 'currentLanguage', { get/set, configurable })` dance
 * that several specs reinvented when `LocalizationService` switched from
 * `getCurrentLanguage()` / `setLanguage()` to a getter/setter pair.
 *
 * The returned mock supports:
 * - reading `service.currentLanguage` (sync getter)
 * - subscribing to `service.currentLanguage$` (replayable observable)
 * - writing `service.currentLanguage = lang` (assertable via `setLanguageSpy`)
 *
 * Test-only helper — do not import from production code.
 */
export function createMockLocalizationService(initial: AvailableLanguage = 'en'): {
  service: Partial<LocalizationService>;
  setLanguageSpy: jest.Mock<void, [AvailableLanguage]>;
} {
  const current$ = new BehaviorSubject<AvailableLanguage>(initial);
  const setLanguageSpy = jest.fn<void, [AvailableLanguage]>(value => {
    current$.next(value);
  });

  const service: Partial<LocalizationService> = {
    currentLanguage$: current$.asObservable() as Observable<AvailableLanguage>,
  };
  Object.defineProperty(service, 'currentLanguage', {
    get: () => current$.getValue(),
    set: setLanguageSpy,
    configurable: true,
  });

  return { service, setLanguageSpy };
}
