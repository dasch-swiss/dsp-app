import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslateLoader } from '@ngx-translate/core';
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader';
import { I18nFallbackTranslateLoader } from './i18n-fallback-translate-loader';

describe('I18nFallbackTranslateLoader', () => {
  let loader: TranslateLoader;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: 'assets/i18n/', suffix: '.json' } },
        { provide: TranslateLoader, useClass: I18nFallbackTranslateLoader },
      ],
    });
    loader = TestBed.inject(TranslateLoader);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('serves the English file when Romansch is requested (no rm.json fetch)', () => {
    loader.getTranslation('rm').subscribe();
    httpMock.expectOne('assets/i18n/en.json').flush({});
    httpMock.expectNone('assets/i18n/rm.json');
  });

  it('serves a language its own file when one exists', () => {
    loader.getTranslation('de').subscribe();
    httpMock.expectOne('assets/i18n/de.json').flush({});
  });
});
