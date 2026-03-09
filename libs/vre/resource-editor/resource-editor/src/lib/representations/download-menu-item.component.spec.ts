import { Clipboard } from '@angular/cdk/clipboard';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Constants, ReadArchiveFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
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
      getIngestUrl: jest.fn().mockReturnValue(of('http://example.com/test-archive.zip')),
    };

    await TestBed.configureTestingModule({
      imports: [DownloadMenuItemComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideTranslateService(),
        { provide: RepresentationService, useValue: representationServiceMock },
        { provide: Clipboard, useValue: { copy: jest.fn() } },
        { provide: NotificationService, useValue: { openSnackBar: jest.fn() } },
      ],
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

  describe('copyUrl', () => {
    it('should copy the link to clipboard and show a notification', () => {
      const clipboardSpy = TestBed.inject(Clipboard);
      const notificationSpy = TestBed.inject(NotificationService);

      component.copyUrl();

      expect(representationServiceMock.getIngestUrl).toHaveBeenCalledWith(mockFileValue, mockParentResource);
      expect(clipboardSpy.copy).toHaveBeenCalledWith('http://example.com/test-archive.zip');
      expect(notificationSpy.openSnackBar).toHaveBeenCalled();
    });
  });
});
