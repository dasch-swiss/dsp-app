import { TestBed } from '@angular/core/testing';
import { LocalStorageLanguageKey } from '@dasch-swiss/vre/core/config';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, Subject } from 'rxjs';
import { LocalizationService } from './localization.service';

describe('LocalizationService', () => {
  let service: LocalizationService;
  let translateService: {
    getCurrentLang: jest.Mock;
    getBrowserLang: jest.Mock;
    use: jest.Mock;
    onLangChange: typeof EMPTY;
  };

  beforeEach(() => {
    localStorage.clear();

    translateService = {
      getCurrentLang: jest.fn().mockReturnValue('en'),
      getBrowserLang: jest.fn().mockReturnValue(undefined),
      use: jest.fn(),
      onLangChange: EMPTY,
    };

    TestBed.configureTestingModule({
      providers: [LocalizationService, { provide: TranslateService, useValue: translateService }],
    });

    service = TestBed.inject(LocalizationService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('init', () => {
    it('uses the language stored in localStorage when it is a supported language', () => {
      localStorage.setItem(LocalStorageLanguageKey, JSON.stringify('de'));

      service.init();

      expect(translateService.use).toHaveBeenCalledWith('de');
      expect(translateService.getBrowserLang).not.toHaveBeenCalled();
    });

    it('falls back to the browser language when localStorage is empty and the browser language is supported', () => {
      translateService.getBrowserLang.mockReturnValue('fr');

      service.init();

      expect(translateService.use).toHaveBeenCalledWith('fr');
    });

    it('falls back to the default language (en) when localStorage is empty and the browser language is unsupported', () => {
      translateService.getBrowserLang.mockReturnValue('es');

      service.init();

      expect(translateService.use).toHaveBeenCalledWith('en');
    });

    it('falls back to the default language (en) when getBrowserLang returns undefined', () => {
      translateService.getBrowserLang.mockReturnValue(undefined);

      service.init();

      expect(translateService.use).toHaveBeenCalledWith('en');
    });

    it('falls back to the default language (en) when the localStorage value is an unsupported language', () => {
      localStorage.setItem(LocalStorageLanguageKey, JSON.stringify('xx'));

      service.init();

      expect(translateService.use).toHaveBeenCalledWith('en');
    });

    it('persists the resolved language to localStorage', () => {
      translateService.getBrowserLang.mockReturnValue('it');

      service.init();

      expect(JSON.parse(localStorage.getItem(LocalStorageLanguageKey) as string)).toBe('it');
    });
  });

  describe('currentLanguage getter', () => {
    it('returns the current language from TranslateService', () => {
      translateService.getCurrentLang.mockReturnValue('de');
      expect(service.currentLanguage).toBe('de');
    });
  });

  describe('currentLanguage setter', () => {
    it('switches the language via TranslateService.use and writes it to localStorage', () => {
      service.currentLanguage = 'rm';

      expect(translateService.use).toHaveBeenCalledWith('rm');
      expect(JSON.parse(localStorage.getItem(LocalStorageLanguageKey) as string)).toBe('rm');
    });
  });

  describe('currentLanguage$', () => {
    it('emits the new language whenever onLangChange fires', done => {
      const onLangChange = new Subject<{ lang: string; translations: unknown }>();
      translateService.onLangChange = onLangChange as unknown as typeof EMPTY;

      // Re-create the service so it subscribes to the new subject.
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [LocalizationService, { provide: TranslateService, useValue: translateService }],
      });
      const freshService = TestBed.inject(LocalizationService);

      freshService.currentLanguage$.subscribe(lang => {
        expect(lang).toBe('fr');
        done();
      });

      onLangChange.next({ lang: 'fr', translations: {} });
    });
  });
});
