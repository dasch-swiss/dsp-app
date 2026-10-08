import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Constants, ReadResource, ReadStillImageExternalFileValue, ReadStillImageFileValue } from '@dasch-swiss/dsp-js';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { RepresentationService } from '../../representation/representation.service';
import { OpenSeaDragonService } from './open-sea-dragon.service';
import { OsdDrawerService } from './osd-drawer.service';
import { StillImageComponent } from './still-image.component';

const makeResource = (
  imageType: 'internal' | 'external' | 'none',
  url = 'http://example.org/image/full/max/0/default.jpg',
  userHasPermission = 'V'
): ReadResource => {
  let properties: Record<string, unknown[]> = {};

  if (imageType === 'internal') {
    properties = {
      [Constants.HasStillImageFileValue]: [
        {
          type: Constants.StillImageFileValue,
          fileUrl: url,
          iiifBaseUrl: 'https://iiif.example.org/0001',
          filename: 'image.jpx',
          dimX: 2368,
          dimY: 1792,
          userHasPermission,
        } as unknown as ReadStillImageFileValue,
      ],
    };
  } else if (imageType === 'external') {
    properties = {
      [Constants.HasStillImageFileValue]: [
        { type: Constants.StillImageExternalFileValue, externalUrl: url } as unknown as ReadStillImageExternalFileValue,
      ],
    };
  }

  return { id: 'http://r/resource', properties } as unknown as ReadResource;
};

describe('StillImageComponent — behavior', () => {
  let component: StillImageComponent;
  let fixture: ComponentFixture<StillImageComponent>;
  let osdServiceMock: {
    viewer: { open: jest.Mock; destroy: jest.Mock; loadTilesWithAjax: boolean };
    onInit: jest.Mock;
    drawing: boolean;
  };
  let osdDrawerServiceMock: { onInit: jest.Mock; update: jest.Mock };
  let representationServiceMock: { getIiifImageInfo: jest.Mock };

  beforeEach(async () => {
    osdServiceMock = {
      viewer: { open: jest.fn(), destroy: jest.fn(), loadTilesWithAjax: false },
      onInit: jest.fn(),
      drawing: false,
    };
    osdDrawerServiceMock = {
      onInit: jest.fn(),
      update: jest.fn(),
    };
    representationServiceMock = { getIiifImageInfo: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [StillImageComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideTranslateService(), { provide: RepresentationService, useValue: representationServiceMock }],
    })
      .overrideComponent(StillImageComponent, {
        set: {
          template: '<div #osdViewer></div>',
          providers: [
            { provide: OpenSeaDragonService, useFactory: () => osdServiceMock },
            { provide: OsdDrawerService, useFactory: () => osdDrawerServiceMock },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(StillImageComponent);
    component = fixture.componentInstance;
    component.compoundMode = false;
  });

  const openedTileSource = () => osdServiceMock.viewer.open.mock.lastCall[0][0].tileSource;
  const openedTiles = () => openedTileSource().tiles;

  describe('when the resource has an internal DSP-hosted image', () => {
    it('opens the image in the viewer without an error message', () => {
      component.resource = makeResource('internal');
      fixture.detectChanges(); // triggers ngAfterViewInit → _loadImage

      expect(component.errorMessage).toBeNull();
      expect(osdServiceMock.viewer.open).toHaveBeenCalled();
    });

    it('opens a full-access image as tiles without requesting its info.json', () => {
      component.resource = makeResource('internal');
      fixture.detectChanges();

      expect(representationServiceMock.getIiifImageInfo).not.toHaveBeenCalled();
      expect(openedTiles()).toEqual([{ scaleFactors: [1, 2, 4, 8, 16, 32], width: 1024 }]);
    });
  });

  describe('when the user only has restricted view on an internal image', () => {
    const openRestricted = async () => {
      component.resource = makeResource('internal', undefined, 'RV');
      fixture.detectChanges();
      await fixture.whenStable();
    };

    it('opens a size-restricted image as one tile of its real size, so it loads with a single request', async () => {
      representationServiceMock.getIiifImageInfo.mockReturnValue(of({ width: 128, height: 97 }));

      await openRestricted();

      expect(representationServiceMock.getIiifImageInfo).toHaveBeenCalledWith(
        'https://iiif.example.org/0001',
        'image.jpx'
      );
      expect(openedTiles()).toEqual([{ scaleFactors: [1], width: 2368, height: 1792 }]);
      expect(openedTileSource()).toEqual(expect.objectContaining({ width: 2368, height: 1792 }));
    });

    it('keeps tiles when Sipi serves the full size (watermark restriction)', async () => {
      representationServiceMock.getIiifImageInfo.mockReturnValue(of({ width: 2368, height: 1792 }));

      await openRestricted();

      expect(openedTiles()).toEqual([{ scaleFactors: [1, 2, 4, 8, 16, 32], width: 1024 }]);
    });

    it('falls back to tiles when the info.json request fails', async () => {
      representationServiceMock.getIiifImageInfo.mockReturnValue(throwError(() => new Error('403')));

      await openRestricted();

      expect(component.errorMessage).toBeNull();
      expect(openedTiles()).toEqual([{ scaleFactors: [1, 2, 4, 8, 16, 32], width: 1024 }]);
    });

    it('keeps the PNG format for a size-restricted image', async () => {
      representationServiceMock.getIiifImageInfo.mockReturnValue(of({ width: 128, height: 97 }));
      component.isPng = true;

      await openRestricted();

      expect(openedTileSource()).toEqual(expect.objectContaining({ preferredFormats: ['png'] }));
    });
  });

  describe('when the resource has an external IIIF image', () => {
    const validIiifUrl = 'https://iiif.example.org/image/id/full/max/0/default.jpg';

    let fetchMock: jest.Mock;

    beforeEach(() => {
      fetchMock = jest.fn();
      (global as any).fetch = fetchMock;
    });

    afterEach(() => {
      delete (global as any).fetch;
    });

    it('shows an error when the IIIF URL cannot be parsed', async () => {
      component.resource = makeResource('external', 'not-a-valid-url');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.errorMessage).toBeTruthy();
    });

    it('fetches the info.json when the IIIF URL is valid', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ width: 800, height: 600, '@id': 'https://iiif.example.org/image/id' }),
      });

      component.resource = makeResource('external', validIiifUrl);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fetchMock).toHaveBeenCalled();
    });

    it('shows an error when the info.json fetch fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      component.resource = makeResource('external', validIiifUrl);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.errorMessage).toBeTruthy();
    });

    it('shows an error when the info.json is missing required fields', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ someOtherField: true }), // no width/height/@id
      });

      component.resource = makeResource('external', validIiifUrl);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.errorMessage).toBeTruthy();
    });
  });

  describe('when the resource has no image file at all', () => {
    it('shows an error message instead of a blank viewer', async () => {
      component.resource = makeResource('none');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.errorMessage).toBeTruthy();
    });
  });

  describe('when the user toggles the image format', () => {
    it('reloads the image in the new format', () => {
      component.resource = makeResource('internal');
      fixture.detectChanges();

      osdServiceMock.viewer.open.mockClear();

      component.afterFormatChange(true); // switch to PNG

      expect(component.isPng).toBe(true);
      expect(osdServiceMock.viewer.open).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('destroys the viewer without error', () => {
      component.resource = makeResource('internal');
      fixture.detectChanges();

      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(osdServiceMock.viewer.destroy).toHaveBeenCalled();
    });
  });
});
