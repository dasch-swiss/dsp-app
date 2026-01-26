import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Constants, ReadArchiveFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { provideTranslateService } from '@ngx-translate/core';
import { DownloadMenuItemComponent } from './download-menu-item.component';
import { RepresentationService } from './representation.service';

describe('DownloadMenuItemComponent', () => {
  let component: DownloadMenuItemComponent;
  let fixture: ComponentFixture<DownloadMenuItemComponent>;
  let representationServiceMock: jest.Mocked<Partial<RepresentationService>>;

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

  beforeEach(async () => {
    representationServiceMock = {
      downloadProjectFile: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DownloadMenuItemComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideTranslateService(), { provide: RepresentationService, useValue: representationServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadMenuItemComponent);
    component = fixture.componentInstance;
    component.src = mockFileValue;
    component.parentResource = mockParentResource;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('download', () => {
    it('should call representationService.downloadProjectFile with correct parameters', () => {
      component.download();

      expect(representationServiceMock.downloadProjectFile).toHaveBeenCalledWith(mockFileValue, mockParentResource);
    });
  });
});
