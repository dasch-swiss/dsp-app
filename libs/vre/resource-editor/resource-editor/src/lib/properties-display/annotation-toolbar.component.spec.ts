import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Constants, ReadColorValue, ReadResource } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RegionService } from '../representations/region.service';
import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { AnnotationToolbarComponent } from './annotation-toolbar.component';

describe('AnnotationToolbarComponent', () => {
  let component: AnnotationToolbarComponent;
  let fixture: ComponentFixture<AnnotationToolbarComponent>;
  let regionServiceMock: jest.Mocked<Pick<RegionService, 'selectRegion' | 'setHighlightedRegionClicked' | 'updateRegions$'>>;
  let resourceFetcherMock: jest.Mocked<Pick<ResourceFetcherService, 'scrollToTop' | 'reload'>>;
  let resourceServiceMock: jest.Mocked<Pick<ResourceService, 'getResourcePath'>>;

  const mockResource = {
    id: 'http://r/annotation1',
    versionArkUrl: 'http://ark/annotation1',
    properties: {},
  } as unknown as ReadResource;

  beforeEach(async () => {
    regionServiceMock = {
      selectRegion: jest.fn(),
      setHighlightedRegionClicked: jest.fn(),
      updateRegions$: jest.fn().mockReturnValue(of(null)),
    };
    resourceFetcherMock = { scrollToTop: jest.fn(), reload: jest.fn() };
    resourceServiceMock = { getResourcePath: jest.fn().mockReturnValue('/project/123/resource/456') };

    await TestBed.configureTestingModule({
      imports: [AnnotationToolbarComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideTranslateService(),
        { provide: RegionService, useValue: regionServiceMock },
        { provide: ResourceFetcherService, useValue: resourceFetcherMock },
        { provide: ResourceService, useValue: resourceServiceMock },
        { provide: NotificationService, useValue: { openSnackBar: jest.fn() } },
      ],
    })
      .overrideComponent(AnnotationToolbarComponent, { set: { template: '<div></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(AnnotationToolbarComponent);
    component = fixture.componentInstance;
    component.resource = mockResource;
    component.parentResourceId = 'http://r/parent';
  });

  describe('readColorValue', () => {
    it('returns null when no color property present', () => {
      expect(component.readColorValue).toBeNull();
    });

    it('returns first color value when present', () => {
      const colorValue = { color: '#ff0000' } as unknown as ReadColorValue;
      component.resource = {
        ...mockResource,
        properties: { [Constants.HasColor]: [colorValue] },
      } as unknown as ReadResource;

      expect(component.readColorValue).toBe(colorValue);
    });
  });

  describe('onPinPointClicked', () => {
    it('calls selectRegion, setHighlightedRegionClicked, and scrollToTop', () => {
      component.onPinPointClicked();

      expect(regionServiceMock.selectRegion).toHaveBeenCalledWith('http://r/annotation1');
      expect(regionServiceMock.setHighlightedRegionClicked).toHaveBeenCalledWith('http://r/annotation1');
      expect(resourceFetcherMock.scrollToTop).toHaveBeenCalled();
    });
  });

  describe('openRegionInNewTab', () => {
    it('calls window.open with correct URL', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

      component.openRegionInNewTab();

      const expectedAnnotationId = encodeURIComponent('http://r/annotation1');
      expect(openSpy).toHaveBeenCalledWith(
        `/${RouteConstants.resource}/project/123/resource/456?${RouteConstants.annotationQueryParam}=${expectedAnnotationId}`,
        '_blank'
      );

      openSpy.mockRestore();
    });
  });

  describe('onResourceDeleted', () => {
    it('calls regionService.updateRegions$()', () => {
      component.onResourceDeleted();

      expect(regionServiceMock.updateRegions$).toHaveBeenCalled();
    });
  });

  describe('onResourceUpdated', () => {
    it('calls resourceFetcher.reload()', () => {
      component.onResourceUpdated();

      expect(resourceFetcherMock.reload).toHaveBeenCalled();
    });
  });
});
