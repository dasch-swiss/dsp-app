import { TestBed } from '@angular/core/testing';
import { LocalStorageLanguageKey } from '@dasch-swiss/vre/core/config';
import { TranslateService } from '@ngx-translate/core';
import { LocalizationService } from './localization.service';

describe('LocalizationService', () => {
  let service: LocalizationService;
  let translateService: {
    getCurrentLang: jest.Mock;
    getBrowserLang: jest.Mock;
    use: jest.Mock;
  };

  beforeEach(() => {
    localStorage.clear();

    translateService = {
      getCurrentLang: jest.fn().mockReturnValue('en'),
      getBrowserLang: jest.fn().mockReturnValue(undefined),
      use: jest.fn(),
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
    it('returns the seeded default language before any change', () => {
      expect(service.currentLanguage).toBe('en');
    });

    it('reflects the language set via the setter', () => {
      service.currentLanguage = 'de';

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

  describe('parseLanguage (static)', () => {
    it('returns the value when it is a supported language', () => {
      expect(LocalizationService.parseLanguage('de')).toBe('de');
      expect(LocalizationService.parseLanguage('en')).toBe('en');
      expect(LocalizationService.parseLanguage('fr')).toBe('fr');
      expect(LocalizationService.parseLanguage('it')).toBe('it');
      expect(LocalizationService.parseLanguage('rm')).toBe('rm');
    });

    it('returns undefined for unsupported, empty, undefined or null values', () => {
      expect(LocalizationService.parseLanguage('xx')).toBeUndefined();
      expect(LocalizationService.parseLanguage('')).toBeUndefined();
      expect(LocalizationService.parseLanguage(undefined)).toBeUndefined();
      expect(LocalizationService.parseLanguage(null)).toBeUndefined();
    });
  });

  describe('currentLanguage$', () => {
    it('emits the seeded value synchronously to a fresh subscriber', () => {
      const received: string[] = [];
      service.currentLanguage$.subscribe(lang => received.push(lang));
      expect(received).toEqual(['en']);
    });

    it('emits the new language whenever the setter is used', () => {
      const received: string[] = [];
      service.currentLanguage$.subscribe(lang => received.push(lang));

      service.currentLanguage = 'fr';

      // BehaviorSubject emits the seeded default first, then 'fr' from the setter.
      expect(received).toEqual(['en', 'fr']);
    });
  });
});
