import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Constants, ReadDocumentFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { AccessTokenService } from '@dasch-swiss/vre/core/session';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { PdfDocumentComponent } from './pdf-document.component';

describe('DocumentComponent', () => {
  let component: PdfDocumentComponent;
  let fixture: ComponentFixture<PdfDocumentComponent>;
  let accessTokenServiceMock: jest.Mocked<Partial<AccessTokenService>>;
  let representationServiceMock: jest.Mocked<Partial<RepresentationService>>;
  let dialogMock: jest.Mocked<Partial<MatDialog>>;
  let resourceFetcherServiceMock: jest.Mocked<Partial<ResourceFetcherService>>;
  let translateServiceMock: jest.Mocked<Partial<TranslateService>>;

  const mockDocumentFileValue: ReadDocumentFileValue = {
    id: 'http://rdf.dasch.swiss/0001/test-file',
    type: Constants.HasDocumentFileValue,
    filename: 'test-document.pdf',
    fileUrl: 'http://example.com/test-document.pdf',
    strval: 'test-document.pdf',
  } as ReadDocumentFileValue;

  const mockNonPdfFileValue: ReadDocumentFileValue = {
    id: 'http://rdf.dasch.swiss/0001/test-file',
    type: Constants.HasDocumentFileValue,
    filename: 'test-document.docx',
    fileUrl: 'http://example.com/test-document.docx',
    strval: 'test-document.docx',
  } as ReadDocumentFileValue;

  const mockParentResource: ReadResource = {
    id: 'http://rdf.dasch.swiss/0001/test-resource',
    type: 'http://www.knora.org/ontology/knora-api/v2#Resource',
    label: 'Test Resource',
  } as ReadResource;

  beforeEach(async () => {
    accessTokenServiceMock = {
      getAccessToken: jest.fn().mockReturnValue('mock-token'),
    };

    representationServiceMock = {
      getFileInfo: jest.fn().mockReturnValue(of({ originalFilename: 'original-test.pdf' })),
      downloadProjectFile: jest.fn(),
    };

    dialogMock = {
      open: jest.fn(),
    };

    resourceFetcherServiceMock = {
      userCanEdit$: of(true),
    };

    translateServiceMock = {
      instant: jest.fn().mockReturnValue('Translated Text'),
    };

    await TestBed.configureTestingModule({
      imports: [PdfDocumentComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideTranslateService(),
        { provide: AccessTokenService, useValue: accessTokenServiceMock },
        { provide: RepresentationService, useValue: representationServiceMock },
        { provide: MatDialog, useValue: dialogMock },
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceMock },
        { provide: TranslateService, useValue: translateServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PdfDocumentComponent);
    component = fixture.componentInstance;
    component.src = mockDocumentFileValue;
    component.parentResource = mockParentResource;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should call _setOriginalFilename when src changes', () => {
      const setOriginalFilenameSpy = jest.spyOn(component as any, '_setOriginalFilename');

      component.ngOnChanges({
        src: new SimpleChange(null, mockDocumentFileValue, true),
      });

      expect(setOriginalFilenameSpy).toHaveBeenCalled();
    });

    it('should call _setPdfSrc when src changes', () => {
      const setPdfSrcSpy = jest.spyOn(component as any, '_setPdfSrc');

      component.ngOnChanges({
        src: new SimpleChange(null, mockDocumentFileValue, true),
      });

      expect(setPdfSrcSpy).toHaveBeenCalled();
    });

    it('should not process changes if src has no currentValue', () => {
      const setOriginalFilenameSpy = jest.spyOn(component as any, '_setOriginalFilename');

      component.ngOnChanges({
        src: new SimpleChange(null, null, true),
      });

      expect(setOriginalFilenameSpy).not.toHaveBeenCalled();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should setup resize observer', () => {
      const setupResizeObserverSpy = jest.spyOn(component as any, '_setupResizeObserver');

      component.ngAfterViewInit();

      expect(setupResizeObserverSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should cleanup resize observer', () => {
      const cleanupResizeObserverSpy = jest.spyOn(component as any, '_cleanupResizeObserver');

      component.ngOnDestroy();

      expect(cleanupResizeObserverSpy).toHaveBeenCalled();
    });
  });

  describe('onSearchQueryChange', () => {
    beforeEach(() => {
      // Mock the PDF component and its eventBus
      component['_pdfComponent'] = {
        eventBus: {
          dispatch: jest.fn(),
        },
      } as any;
    });

    it('should dispatch "find" event when query changes', () => {
      component.pdfQuery = 'old query';
      component.onSearchQueryChange('new query');

      expect(component['_pdfComponent'].eventBus.dispatch).toHaveBeenCalledWith('find', {
        query: 'new query',
        highlightAll: true,
      });
    });

    it('should dispatch "findagain" event when query is the same', () => {
      component.pdfQuery = 'same query';
      component.onSearchQueryChange('same query');

      expect(component['_pdfComponent'].eventBus.dispatch).toHaveBeenCalledWith('findagain', {
        query: 'same query',
        highlightAll: true,
      });
    });

    it('should update pdfQuery property', () => {
      component.pdfQuery = '';
      component.onSearchQueryChange('test query');

      expect(component.pdfQuery).toBe('test query');
    });
  });

  describe('onDownload', () => {
    it('should call representationService.downloadProjectFile', () => {
      component.onDownload();

      expect(representationServiceMock.downloadProjectFile).toHaveBeenCalledWith(
        mockDocumentFileValue,
        mockParentResource
      );
    });
  });

  describe('onFullscreenToggle', () => {
    it('should request fullscreen on pdf-viewer element', () => {
      const mockElement = {
        requestFullscreen: jest.fn(),
      };

      // Mock the _pdfComponent with pdfViewerContainer.nativeElement
      component['_pdfComponent'] = {
        pdfViewerContainer: {
          nativeElement: mockElement,
        },
      } as any;

      component.onFullscreenToggle();

      expect(mockElement.requestFullscreen).toHaveBeenCalled();
    });

    it('should handle missing pdf-viewer element gracefully', () => {
      component['_pdfComponent'] = undefined as any;

      expect(() => component.onFullscreenToggle()).not.toThrow();
    });
  });

  describe('onZoomChange', () => {
    it('should update zoom factor', () => {
      component.zoomFactor = 1.0;
      component.onZoomChange(1.5);

      expect(component.zoomFactor).toBe(1.5);
    });

    it('should handle different zoom values', () => {
      component.zoomFactor = 1.0;
      component.onZoomChange(0.5);

      expect(component.zoomFactor).toBe(0.5);
    });
  });

  describe('onPdfLoadError', () => {
    it('should set failedToLoad to true', () => {
      component.failedToLoad = false;

      component.onPdfLoadError(new Error('Load failed'));

      expect(component.failedToLoad).toBe(true);
    });
  });

  describe('_setOriginalFilename', () => {
    it('should fetch and set original filename', done => {
      component['_setOriginalFilename']();

      setTimeout(() => {
        expect(representationServiceMock.getFileInfo).toHaveBeenCalledWith(mockDocumentFileValue.fileUrl);
        expect(component.originalFilename).toBe('original-test.pdf');
        done();
      }, 10);
    });

    it('should set failedToLoad to true on error', done => {
      representationServiceMock.getFileInfo = jest.fn().mockReturnValue(throwError(() => new Error('Fetch failed')));

      component['_setOriginalFilename']();

      setTimeout(() => {
        expect(component.failedToLoad).toBe(true);
        done();
      }, 10);
    });
  });

  describe('_setPdfSrc', () => {
    it('should set pdfSrc with auth token when available', () => {
      component.pdfSrc = null;

      component['_setPdfSrc']();

      expect(component.pdfSrc).toEqual({
        url: mockDocumentFileValue.fileUrl,
        httpHeaders: { Authorization: 'Bearer mock-token' },
        withCredentials: true,
      });
    });

    it('should set pdfSrc without auth headers when no token available', () => {
      accessTokenServiceMock.getAccessToken = jest.fn().mockReturnValue(null);
      component.pdfSrc = null;

      component['_setPdfSrc']();

      expect(component.pdfSrc).toEqual({
        url: mockDocumentFileValue.fileUrl,
        withCredentials: true,
      });
    });

    it('should not update pdfSrc if URL has not changed', () => {
      const originalPdfSrc = {
        url: mockDocumentFileValue.fileUrl,
        httpHeaders: { Authorization: 'Bearer mock-token' },
        withCredentials: true,
      };
      component.pdfSrc = originalPdfSrc;

      component['_setPdfSrc']();

      expect(component.pdfSrc).toBe(originalPdfSrc);
    });

    it('should update pdfSrc if URL has changed', () => {
      component.pdfSrc = {
        url: 'http://example.com/old-document.pdf',
        withCredentials: true,
      };

      component['_setPdfSrc']();

      expect(component.pdfSrc?.url).toBe(mockDocumentFileValue.fileUrl);
    });
  });

  describe('_cleanupResizeObserver', () => {
    it('should disconnect and null the resize observer', () => {
      const mockObserver = {
        disconnect: jest.fn(),
      };
      component['_resizeObserver'] = mockObserver as any;

      component['_cleanupResizeObserver']();

      expect(mockObserver.disconnect).toHaveBeenCalled();
      expect(component['_resizeObserver']).toBeNull();
    });

    it('should handle null resize observer gracefully', () => {
      component['_resizeObserver'] = null;

      expect(() => component['_cleanupResizeObserver']()).not.toThrow();
    });
  });
});
