import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ReadDocumentFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { AccessTokenService } from '@dasch-swiss/vre/core/session';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { DocumentComponent } from './document.component';

describe('DocumentComponent', () => {
  let component: DocumentComponent;
  let fixture: ComponentFixture<DocumentComponent>;
  let mockAccessTokenService: jest.Mocked<AccessTokenService>;
  let mockRepresentationService: jest.Mocked<RepresentationService>;

  const mockDocumentFileValue = {
    id: 'test-id',
    type: 'http://api.knora.org/ontology/knora-api/v2#DocumentFileValue',
    filename: 'test-document.pdf',
    fileUrl: 'https://iiif.dasch.swiss/082D/test.pdf/file',
  } as ReadDocumentFileValue;

  const mockResource = {
    id: 'resource-id',
    type: 'http://api.knora.org/ontology/knora-api/v2#Resource',
    attachedToProject: 'project-id',
  } as ReadResource;

  beforeEach(async () => {
    mockAccessTokenService = {
      getAccessToken: jest.fn(),
    } as any;

    mockRepresentationService = {
      getFileInfo: jest.fn(),
      downloadProjectFile: jest.fn(),
    } as any;

    const mockResourceFetcherService = {
      userCanEdit$: of(false),
    } as any;

    const mockMatDialog = {
      open: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [DocumentComponent, TranslateModule.forRoot()],
      providers: [
        { provide: AccessTokenService, useValue: mockAccessTokenService },
        { provide: RepresentationService, useValue: mockRepresentationService },
        { provide: ResourceFetcherService, useValue: mockResourceFetcherService },
        { provide: MatDialog, useValue: mockMatDialog },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentComponent);
    component = fixture.componentInstance;
    component.src = mockDocumentFileValue;
    component.parentResource = mockResource;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isPdf', () => {
    it('should return true for PDF files', () => {
      component.src = { ...mockDocumentFileValue, filename: 'document.pdf' } as ReadDocumentFileValue;
      expect(component.isPdf).toBe(true);
    });

    it('should return false for non-PDF files', () => {
      component.src = { ...mockDocumentFileValue, filename: 'document.docx' } as ReadDocumentFileValue;
      expect(component.isPdf).toBe(false);
    });
  });

  describe('_setPdfSrc', () => {
    it('should create pdfSrc with Bearer token when user is authenticated', () => {
      const mockToken = 'mock-jwt-token';
      mockAccessTokenService.getAccessToken.mockReturnValue(mockToken);

      component['_setPdfSrc']();

      expect(component.pdfSrc).toEqual({
        url: mockDocumentFileValue.fileUrl,
        httpHeaders: {
          Authorization: `Bearer ${mockToken}`,
        },
        withCredentials: true,
      });
    });

    it('should create pdfSrc without Bearer token when user is not authenticated', () => {
      mockAccessTokenService.getAccessToken.mockReturnValue(null);

      component['_setPdfSrc']();

      expect(component.pdfSrc).toEqual({
        url: mockDocumentFileValue.fileUrl,
        withCredentials: true,
      });
    });

    it('should not recreate pdfSrc if URL has not changed', () => {
      const mockToken = 'mock-jwt-token';
      mockAccessTokenService.getAccessToken.mockReturnValue(mockToken);

      component['_setPdfSrc']();
      const firstPdfSrc = component.pdfSrc;

      component['_setPdfSrc']();
      const secondPdfSrc = component.pdfSrc;

      expect(firstPdfSrc).toBe(secondPdfSrc);
    });
  });

  describe('onPdfLoadError', () => {
    it('should set failedToLoad to true when PDF fails to load', () => {
      component.failedToLoad = false;

      component.onPdfLoadError(new Error('PDF load failed'));

      expect(component.failedToLoad).toBe(true);
    });
  });

  describe('ngOnChanges', () => {
    it('should initialize pdfSrc and fetch file info when src changes', () => {
      mockRepresentationService.getFileInfo.mockReturnValue(of({ originalFilename: 'test.pdf' }));
      mockAccessTokenService.getAccessToken.mockReturnValue('mock-token');

      component.ngOnChanges({
        src: {
          currentValue: mockDocumentFileValue,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component.pdfSrc).toBeTruthy();
      expect(component.pdfSrc?.url).toBe(mockDocumentFileValue.fileUrl);
      expect(mockRepresentationService.getFileInfo).toHaveBeenCalledWith(mockDocumentFileValue.fileUrl);
    });
  });

  describe('zoom', () => {
    it('should increase zoom factor when called with 1', () => {
      component.zoomFactor = 1.0;

      component.zoom(1);

      expect(component.zoomFactor).toBe(1.2);
    });

    it('should decrease zoom factor when called with -1', () => {
      component.zoomFactor = 1.0;

      component.zoom(-1);

      expect(component.zoomFactor).toBe(0.8);
    });

    it('should not go below minimum zoom of 0.2', () => {
      component.zoomFactor = 0.2;

      component.zoom(-1);

      expect(component.zoomFactor).toBe(0.2);
    });
  });
});
