import { HttpClient, HttpDownloadProgressEvent, HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { Directive, EventEmitter, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PropertyDefinition } from '@dasch-swiss/dsp-js';
import { BASE_PATH } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { DownloadDialogResourcesTabComponent } from './download-dialog-resources-tab.component';

@Directive({
  selector: '[appLoadingButton]',
  standalone: true,
})
class MockLoadingButtonDirective {
  @Input() isLoading = false;
}

describe('DownloadDialogResourcesTabComponent', () => {
  let component: DownloadDialogResourcesTabComponent;
  let fixture: ComponentFixture<DownloadDialogResourcesTabComponent>;
  let mockHttp: jest.Mocked<HttpClient>;
  let events$: Subject<HttpEvent<string>>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockLocalizationService: jest.Mocked<LocalizationService>;
  let mockTranslateService: jest.Mocked<TranslateService>;

  let createElementSpy: jest.SpyInstance;
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;
  let createObjectURLSpy: jest.SpyInstance;
  let revokeObjectURLSpy: jest.SpyInstance;

  const createMockPropertyInfo = (id: string, label: string): PropertyInfoValues => ({
    propDef: { id, label } as PropertyDefinition,
    guiDef: {} as any,
    values: [],
  });

  const mockProperty1 = createMockPropertyInfo('prop-1', 'Title');
  const mockProperty2 = createMockPropertyInfo('prop-2', 'Description');

  beforeEach(async () => {
    events$ = new Subject<HttpEvent<string>>();
    mockHttp = { post: jest.fn().mockReturnValue(events$.asObservable()) } as unknown as jest.Mocked<HttpClient>;

    mockNotificationService = { openSnackBar: jest.fn() } as any;
    mockLocalizationService = { getCurrentLanguage: jest.fn().mockReturnValue('en') } as any;
    mockTranslateService = {
      instant: jest.fn((key: string) => key),
      get: jest.fn((key: string) => of(key)),
      onTranslationChange: new EventEmitter(),
      onLangChange: new EventEmitter(),
      // ngx-translate v17 renamed onDefaultLangChange -> onFallbackLangChange; TranslatePipe subscribes to it.
      onFallbackLangChange: new EventEmitter(),
      currentLang: 'en',
    } as any;

    createElementSpy = jest.spyOn(document, 'createElement');
    appendChildSpy = jest.spyOn(document.body, 'appendChild');
    removeChildSpy = jest.spyOn(document.body, 'removeChild');

    if (!window.URL.createObjectURL) window.URL.createObjectURL = jest.fn();
    if (!window.URL.revokeObjectURL) window.URL.revokeObjectURL = jest.fn();
    createObjectURLSpy = jest.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = jest.spyOn(window.URL, 'revokeObjectURL').mockImplementation();

    await TestBed.configureTestingModule({
      imports: [DownloadDialogResourcesTabComponent, FormsModule, NoopAnimationsModule, MockLoadingButtonDirective],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: HttpClient, useValue: mockHttp },
        { provide: BASE_PATH, useValue: 'https://test-api' },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: LocalizationService, useValue: mockLocalizationService },
        { provide: TranslateService, useValue: mockTranslateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadDialogResourcesTabComponent);
    component = fixture.componentInstance;

    component.properties = [mockProperty1, mockProperty2];
    component.resourceClassIri = 'http://example.org/ontology/ResourceClass';
    component.resourceCount = 100;
  });

  afterEach(() => {
    jest.clearAllMocks();
    createElementSpy?.mockRestore();
    appendChildSpy?.mockRestore();
    removeChildSpy?.mockRestore();
    createObjectURLSpy?.mockRestore();
    revokeObjectURLSpy?.mockRestore();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have includeArkUrls set to false', () => {
      expect(component.includeArkUrls).toBe(false);
    });

    it('should have includeResourceIris set to false', () => {
      expect(component.includeResourceIris).toBe(false);
    });

    it('should have isDownloading set to false', () => {
      expect(component.isDownloading).toBe(false);
    });

    it('should have empty selectedPropertyIds', () => {
      expect(component.selectedPropertyIds).toEqual([]);
    });
  });

  describe('downloadCsv', () => {
    beforeEach(() => {
      component.selectedPropertyIds = ['prop-1', 'prop-2'];
    });

    it('calls HttpClient.post with expected URL, body, and streaming options', () => {
      component.includeResourceIris = false;
      component.includeArkUrls = false;

      component.downloadCsv();

      expect(mockHttp.post).toHaveBeenCalledWith(
        'https://test-api/v3/export/resources',
        {
          resourceClass: 'http://example.org/ontology/ResourceClass',
          selectedProperties: ['prop-1', 'prop-2'],
          language: 'en',
          includeIris: false,
          includeArkUrls: false,
        },
        // All three flags are load-bearing: responseType:'text' enables partialText on DownloadProgress events.
        expect.objectContaining({
          reportProgress: true,
          observe: 'events',
          responseType: 'text',
        })
      );
    });

    it('passes includeIris=true when toggled', () => {
      component.includeResourceIris = true;
      component.downloadCsv();
      expect(mockHttp.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ includeIris: true }),
        expect.any(Object)
      );
    });

    it('passes includeArkUrls=true when toggled', () => {
      component.includeArkUrls = true;
      component.downloadCsv();
      expect(mockHttp.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ includeArkUrls: true }),
        expect.any(Object)
      );
    });

    it('passes the current language from LocalizationService', () => {
      mockLocalizationService.getCurrentLanguage.mockReturnValue('de');
      component.downloadCsv();
      expect(mockHttp.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ language: 'de' }),
        expect.any(Object)
      );
    });

    it('sets isDownloading to true when download starts', () => {
      component.downloadCsv();
      expect(component.isDownloading).toBe(true);
    });

    it('sets isDownloading to false after observable completes', () => {
      component.downloadCsv();
      events$.next(new HttpResponse({ body: 'h\nr1\n', status: 200 }));
      events$.complete();
      expect(component.isDownloading).toBe(false);
    });

    it('sets isDownloading to false after error', () => {
      component.downloadCsv();
      events$.error(new Error('network error'));
      expect(component.isDownloading).toBe(false);
    });

    describe('DownloadProgress events', () => {
      it('updates rowsReceived from partialText (subtracts header row)', () => {
        component.resourceCount = 5_000;
        component.downloadCsv();

        events$.next({
          type: HttpEventType.DownloadProgress,
          loaded: 100,
          total: 500,
          partialText: 'h\nr1\nr2\n',
        } as HttpDownloadProgressEvent);

        expect(component.rowsReceived).toBe(2);
      });

      it('advances rowsReceived as more partialText arrives', () => {
        component.resourceCount = 5_000;
        component.downloadCsv();

        events$.next({
          type: HttpEventType.DownloadProgress,
          loaded: 100,
          total: 500,
          partialText: 'h\nr1\nr2\n',
        } as HttpDownloadProgressEvent);
        expect(component.rowsReceived).toBe(2);

        events$.next({
          type: HttpEventType.DownloadProgress,
          loaded: 300,
          total: 500,
          partialText: 'h\nr1\nr2\nr3\nr4\n',
        } as HttpDownloadProgressEvent);
        expect(component.rowsReceived).toBe(4);
      });

      it('rowsReceived is monotonically non-decreasing across events (REQ-2.3)', () => {
        component.resourceCount = 5_000;
        component.downloadCsv();

        const snapshots = ['h\nr1\n', 'h\nr1\nr2\n', 'h\nr1\nr2\nr3\n', 'h\nr1\nr2\nr3\nr4\n'];
        let prev = 0;
        for (const partialText of snapshots) {
          events$.next({ type: HttpEventType.DownloadProgress, loaded: 0, partialText } as HttpDownloadProgressEvent);
          expect(component.rowsReceived).toBeGreaterThanOrEqual(prev);
          prev = component.rowsReceived;
        }
      });
    });

    describe('progressPercent', () => {
      it('returns 0 when resourceCount is 0', () => {
        component.resourceCount = 0;
        expect(component.progressPercent).toBe(0);
      });

      it('reflects ratio of rowsReceived to resourceCount', () => {
        component.resourceCount = 100;
        component.downloadCsv();

        events$.next({
          type: HttpEventType.DownloadProgress,
          loaded: 50,
          partialText: 'h\n' + Array(51).fill('r\n').join(''),
        } as HttpDownloadProgressEvent);

        expect(component.progressPercent).toBeLessThanOrEqual(100);
        expect(component.progressPercent).toBeGreaterThan(0);
      });

      it('clamps to 100 even when rowsReceived would exceed resourceCount (REQ-2.5)', () => {
        component.resourceCount = 2;
        component.downloadCsv();

        // More rows than resourceCount — should not exceed 100%
        events$.next({
          type: HttpEventType.DownloadProgress,
          loaded: 100,
          partialText: 'h\nr1\nr2\nr3\nr4\nr5\n',
        } as HttpDownloadProgressEvent);

        expect(component.progressPercent).toBe(100);
      });
    });

    describe('terminal HttpResponse', () => {
      const finalBody = 'h\nr1\nr2\nr3\nr4\n';

      it('creates blob with the response body', () => {
        component.downloadCsv();
        events$.next(new HttpResponse({ body: finalBody, status: 200 }));
        events$.complete();

        expect(createObjectURLSpy).toHaveBeenCalled();
        const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
        expect(blobArg.type).toBe('text/csv');
      });

      it('creates and clicks a download anchor', () => {
        component.downloadCsv();
        events$.next(new HttpResponse({ body: finalBody, status: 200 }));
        events$.complete();

        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(appendChildSpy).toHaveBeenCalled();
        expect(removeChildSpy).toHaveBeenCalled();
      });

      it('revokes the object URL after download', () => {
        component.downloadCsv();
        events$.next(new HttpResponse({ body: finalBody, status: 200 }));
        events$.complete();

        expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
      });

      it('shows success snackbar', () => {
        component.downloadCsv();
        events$.next(new HttpResponse({ body: finalBody, status: 200 }));
        events$.complete();

        expect(mockNotificationService.openSnackBar).toHaveBeenCalledWith(
          'pages.dataBrowser.downloadDialog.downloadSuccess'
        );
      });

      it('emits afterClosed', () => {
        const emitSpy = jest.spyOn(component.afterClosed, 'emit');
        component.downloadCsv();
        events$.next(new HttpResponse({ body: finalBody, status: 200 }));
        events$.complete();

        expect(emitSpy).toHaveBeenCalled();
      });
    });

    describe('error path', () => {
      it('shows error snackbar', () => {
        component.downloadCsv();
        events$.error(new Error('network error'));

        expect(mockNotificationService.openSnackBar).toHaveBeenCalledWith(
          'pages.dataBrowser.downloadDialog.downloadError'
        );
      });

      it('does not create blob on error', () => {
        component.downloadCsv();
        events$.error(new Error('network error'));

        expect(createObjectURLSpy).not.toHaveBeenCalled();
      });

      it('does not emit afterClosed on error', () => {
        const emitSpy = jest.spyOn(component.afterClosed, 'emit');
        component.downloadCsv();
        events$.error(new Error('network error'));

        expect(emitSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('progress bar visibility', () => {
    it('does not render mat-progress-bar when resourceCount <= 1000', () => {
      component.resourceCount = 1_000;
      component.downloadCsv();
      fixture.detectChanges();

      const progressBar = fixture.nativeElement.querySelector('mat-progress-bar');
      expect(progressBar).toBeNull();
    });

    it('renders mat-progress-bar when isDownloading and resourceCount > 1000', () => {
      component.resourceCount = 1_001;
      component.downloadCsv();
      fixture.detectChanges();

      const progressBar = fixture.nativeElement.querySelector('mat-progress-bar');
      expect(progressBar).not.toBeNull();
    });
  });

  describe('selectedPropertyIds', () => {
    it('updates when property selection changes', () => {
      expect(component.selectedPropertyIds).toEqual([]);
      component.selectedPropertyIds = ['prop-1', 'prop-2'];
      expect(component.selectedPropertyIds).toEqual(['prop-1', 'prop-2']);
    });
  });
});
