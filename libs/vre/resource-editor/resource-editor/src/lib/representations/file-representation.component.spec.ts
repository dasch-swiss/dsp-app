import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Constants, ReadArchiveFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { FileRepresentationComponent } from './file-representation.component';
import { RepresentationService } from './representation.service';
import { ResourceFetcherService } from './resource-fetcher.service';

describe('FileRepresentationComponent', () => {
  let component: FileRepresentationComponent;
  let fixture: ComponentFixture<FileRepresentationComponent>;
  let representationServiceMock: jest.Mocked<Partial<RepresentationService>>;
  let resourceFetcherServiceMock: jest.Mocked<Partial<ResourceFetcherService>>;

  const mockFileValue: ReadArchiveFileValue = {
    id: 'http://rdf.dasch.swiss/0001/test-file',
    type: Constants.HasArchiveFileValue,
    filename: 'test-archive.zip',
    fileUrl: 'http://example.com/test-archive.zip',
    strval: 'test-archive.zip',
  } as ReadArchiveFileValue;

  const mockParentResource: ReadResource = {
    id: 'http://rdf.dasch.swiss/0001/test-resource',
    type: 'http://www.knora.org/ontology/knora-api/v2#Resource',
    label: 'Test Resource',
  } as ReadResource;

  const mockDialogConfig = {
    title: 'Archive',
    representation: Constants.HasArchiveFileValue,
  };

  beforeEach(async () => {
    representationServiceMock = {
      getFileInfo: jest.fn().mockReturnValue(of({ originalFilename: 'original-test.zip' })),
    };

    resourceFetcherServiceMock = {
      userCanEdit$: of(true),
    };

    await TestBed.configureTestingModule({
      imports: [FileRepresentationComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideTranslateService(),
        { provide: RepresentationService, useValue: representationServiceMock },
        { provide: ResourceFetcherService, useValue: resourceFetcherServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FileRepresentationComponent);
    component = fixture.componentInstance;
    component.src = mockFileValue;
    component.parentResource = mockParentResource;
    component.dialogConfig = mockDialogConfig;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should fetch file info when src changes', done => {
      component.ngOnChanges({
        src: new SimpleChange(null, mockFileValue, true),
      });

      setTimeout(() => {
        expect(representationServiceMock.getFileInfo).toHaveBeenCalledWith(mockFileValue.fileUrl);
        expect(component.originalFilename).toBe('original-test.zip');
        done();
      }, 10);
    });

    it('should set failedToLoad to true on error', done => {
      representationServiceMock.getFileInfo = jest.fn().mockReturnValue(throwError(() => new Error('Fetch failed')));

      component.ngOnChanges({
        src: new SimpleChange(null, mockFileValue, true),
      });

      setTimeout(() => {
        expect(component.failedToLoad).toBe(true);
        done();
      }, 10);
    });

    it('should not fetch file info if src has not changed', () => {
      component.ngOnChanges({
        otherProp: new SimpleChange(null, 'value', true),
      });

      expect(representationServiceMock.getFileInfo).not.toHaveBeenCalled();
    });

    it('should handle originalFilename from nested property', done => {
      representationServiceMock.getFileInfo = jest
        .fn()
        .mockReturnValue(of({ originalFilename: 'nested-filename.zip' }));

      component.ngOnChanges({
        src: new SimpleChange(null, mockFileValue, true),
      });

      setTimeout(() => {
        expect(component.originalFilename).toBe('nested-filename.zip');
        done();
      }, 10);
    });
  });
});
