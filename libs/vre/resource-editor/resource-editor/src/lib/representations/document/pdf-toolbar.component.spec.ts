import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Constants, ReadDocumentFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { PdfToolbarComponent } from './pdf-toolbar.component';

describe('PdfToolbarComponent', () => {
  let component: PdfToolbarComponent;
  let fixture: ComponentFixture<PdfToolbarComponent>;
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

  const mockParentResource: ReadResource = {
    id: 'http://rdf.dasch.swiss/0001/test-resource',
    type: 'http://www.knora.org/ontology/knora-api/v2#Resource',
    label: 'Test Resource',
  } as ReadResource;

  beforeEach(async () => {
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
      imports: [PdfToolbarComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideTranslateService(),
        { provide: MatDialog, useValue: dialogMock },
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceMock },
        { provide: TranslateService, useValue: translateServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PdfToolbarComponent);
    component = fixture.componentInstance;
    component.zoomFactor = 1.0;
    component.parentResource = mockParentResource;
    component.src = mockDocumentFileValue;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onSearchInput', () => {
    it('should emit searchQuery with input value', () => {
      const searchQuerySpy = jest.spyOn(component.searchQuery, 'emit');
      const mockEvent = { target: { value: 'test query' } } as any;

      component.onSearchInput(mockEvent);

      expect(searchQuerySpy).toHaveBeenCalledWith('test query');
    });
  });

  describe('handleZoom', () => {
    it('should increase zoom by 0.2 when mod is 1', () => {
      const zoomChangeSpy = jest.spyOn(component.zoomChange, 'emit');
      component.zoomFactor = 1.0;

      component.handleZoom(1);

      expect(zoomChangeSpy).toHaveBeenCalledWith(1.2);
    });

    it('should decrease zoom by 0.2 when mod is -1', () => {
      const zoomChangeSpy = jest.spyOn(component.zoomChange, 'emit');
      component.zoomFactor = 1.0;

      component.handleZoom(-1);

      expect(zoomChangeSpy).toHaveBeenCalledWith(0.8);
    });

    it('should set minimum zoom to 0.2 when result would be <= 0', () => {
      const zoomChangeSpy = jest.spyOn(component.zoomChange, 'emit');
      component.zoomFactor = 0.1;

      component.handleZoom(-1);

      expect(zoomChangeSpy).toHaveBeenCalledWith(0.2);
    });

    it('should round zoom to 2 decimal places', () => {
      const zoomChangeSpy = jest.spyOn(component.zoomChange, 'emit');
      component.zoomFactor = 1.15;

      component.handleZoom(1);

      expect(zoomChangeSpy).toHaveBeenCalledWith(1.35);
    });
  });

  describe('resetZoom', () => {
    it('should emit zoomChange with value 1', () => {
      const zoomChangeSpy = jest.spyOn(component.zoomChange, 'emit');
      component.zoomFactor = 1.5;

      component.resetZoom();

      expect(zoomChangeSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('openReplaceDialog', () => {
    it('should open replace file dialog with correct configuration', () => {
      component.openReplaceDialog();

      expect(dialogMock.open).toHaveBeenCalled();
      expect(translateServiceMock.instant).toHaveBeenCalledWith('resourceEditor.representations.document.title');
    });
  });
});
