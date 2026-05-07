import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Constants, ReadMovingImageFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { MovingImageSidecar } from '../moving-image-sidecar';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { ResourceUtil } from '../resource.util';
import { VideoMoreButtonComponent } from './video-more-button.component';

describe('VideoMoreButtonComponent', () => {
  let component: VideoMoreButtonComponent;
  let fixture: ComponentFixture<VideoMoreButtonComponent>;

  const mockSrc = {
    id: 'http://rdf.dasch.swiss/0001/test-video',
    type: Constants.MovingImageFileValue,
    fileUrl: 'http://example.com/video.mp4',
    userHasPermission: 'V',
  } as unknown as ReadMovingImageFileValue;

  const mockParentResource = {
    id: 'http://rdf.dasch.swiss/0001/test-resource',
    type: 'http://www.knora.org/ontology/knora-api/v2#Resource',
    label: 'Test Resource',
  } as unknown as ReadResource;

  const mockFileInfo = {} as MovingImageSidecar;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoMoreButtonComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideTranslateService(),
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: RepresentationService, useValue: { downloadProjectFile: jest.fn() } },
        { provide: ResourceFetcherService, useValue: { userCanEdit$: of(false) } },
        { provide: NotificationService, useValue: { openSnackBar: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoMoreButtonComponent);
    component = fixture.componentInstance;
    component.src = mockSrc;
    component.parentResource = mockParentResource;
    component.fileInfo = mockFileInfo;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('userCanView', () => {
    it('returns false when userHasPermission is RV', () => {
      component.src = { ...mockSrc, userHasPermission: 'RV' } as unknown as ReadMovingImageFileValue;
      expect(component.userCanView).toBe(false);
    });

    it('returns true when userHasPermission is V', () => {
      component.src = { ...mockSrc, userHasPermission: 'V' } as unknown as ReadMovingImageFileValue;
      expect(component.userCanView).toBe(true);
    });

    it('returns true when userHasPermission is M', () => {
      component.src = { ...mockSrc, userHasPermission: 'M' } as unknown as ReadMovingImageFileValue;
      expect(component.userCanView).toBe(true);
    });
  });

  describe('userCanView delegates to ResourceUtil', () => {
    it('calls ResourceUtil.userCanView with src', () => {
      const spy = jest.spyOn(ResourceUtil, 'userCanView').mockReturnValue(true);

      component.userCanView;

      expect(spy).toHaveBeenCalledWith(mockSrc);
    });
  });
});
