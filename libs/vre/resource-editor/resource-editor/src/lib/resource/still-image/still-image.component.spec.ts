import { HttpErrorResponse } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Constants, ReadResource, ReadStillImageExternalFileValue, ReadStillImageFileValue } from '@dasch-swiss/dsp-js';
import { provideTranslateService } from '@ngx-translate/core';
import { of, Subject, throwError } from 'rxjs';
import { IiifImageInfo } from '../../representation/iiif-image-info';
import { RepresentationService } from '../../representation/representation.service';
import { OpenSeaDragonService } from './open-sea-dragon.service';
import { OsdDrawerService } from './osd-drawer.service';
import { StillImageComponent } from './still-image.component';

const IIIF_BASE_URL = 'https://iiif.example.org/0803';

// A size-restricted image as Sipi describes it: smaller than the native 2613x3505 of the file value.
const makeImageInfo = (filename: string): IiifImageInfo => ({
  '@context': 'http://iiif.io/api/image/3/context.json',
  id: `${IIIF_BASE_URL}/${filename}`,
  protocol: 'http://iiif.io/api/image',
  profile: 'level2',
  width: 382,
  height: 512,
  preferredFormats: ['jpg', 'png'],
});

const makeResource = (
  imageType: 'internal' | 'external' | 'none',
  url = 'http://example.org/image/full/max/0/default.jpg',
  filename = 'image.jp2'
): ReadResource => {
  let properties: Record<string, unknown[]> = {};

  if (imageType === 'internal') {
    properties = {
      [Constants.HasStillImageFileValue]: [
        {
          type: Constants.StillImageFileValue,
          fileUrl: url,
          iiifBaseUrl: IIIF_BASE_URL,
          filename,
          dimX: 2613,
          dimY: 3505,
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
    viewer: { open: jest.Mock; close: jest.Mock; destroy: jest.Mock; loadTilesWithAjax: boolean };
    onInit: jest.Mock;
    drawing: boolean;
  };
  let osdDrawerServiceMock: { onInit: jest.Mock; update: jest.Mock };
  let representationServiceMock: { getIiifImageInfo: jest.Mock };

  const openedTileSource = () => osdServiceMock.viewer.open.mock.calls.at(-1)[0][0].tileSource;

  beforeEach(async () => {
    osdServiceMock = {
      viewer: { open: jest.fn(), close: jest.fn(), destroy: jest.fn(), loadTilesWithAjax: false },
      onInit: jest.fn(),
      drawing: false,
    };
    osdDrawerServiceMock = {
      onInit: jest.fn(),
      update: jest.fn(),
    };
    representationServiceMock = {
      getIiifImageInfo: jest.fn((_base: string, filename: string) => of(makeImageInfo(filename))),
    };

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

  describe('when the resource has an internal DSP-hosted image', () => {
    it('opens the image in the viewer without an error message', async () => {
      component.resource = makeResource('internal');
      fixture.detectChanges(); // triggers ngAfterViewInit → _loadImage
      await fixture.whenStable();

      expect(component.errorMessage).toBeNull();
      expect(osdServiceMock.viewer.open).toHaveBeenCalled();
    });

    it("draws from Sipi's info.json, not from the native dimensions of the file value", async () => {
      component.resource = makeResource('internal', undefined, 'restricted.jp2');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(representationServiceMock.getIiifImageInfo).toHaveBeenCalledWith(IIIF_BASE_URL, 'restricted.jp2');
      expect(openedTileSource()).toEqual(makeImageInfo('restricted.jp2'));
    });

    it('clears the viewer but keeps it (and the compound navigation) when the info.json cannot be fetched', async () => {
      representationServiceMock.getIiifImageInfo.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }))
      );

      component.resource = makeResource('internal');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.errorMessage).toBeNull();
      expect(osdServiceMock.viewer.close).toHaveBeenCalled();
      expect(osdServiceMock.viewer.open).not.toHaveBeenCalled();
    });

    it('drops an info.json answer that arrives after the next image was requested', async () => {
      const firstAnswer = new Subject<IiifImageInfo>();
      const secondAnswer = new Subject<IiifImageInfo>();
      representationServiceMock.getIiifImageInfo.mockReturnValueOnce(firstAnswer).mockReturnValueOnce(secondAnswer);

      component.resource = makeResource('internal', undefined, 'page-1.jp2');
      fixture.detectChanges();
      component.resource = makeResource('internal', undefined, 'page-2.jp2');
      component.ngOnChanges({ resource: new SimpleChange(null, component.resource, false) });

      secondAnswer.next(makeImageInfo('page-2.jp2'));
      secondAnswer.complete();
      firstAnswer.next(makeImageInfo('page-1.jp2'));
      firstAnswer.complete();
      await fixture.whenStable();

      expect(osdServiceMock.viewer.open).toHaveBeenCalledTimes(1);
      expect(openedTileSource()).toEqual(makeImageInfo('page-2.jp2'));
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
    it('reloads the image with PNG tiles', async () => {
      component.resource = makeResource('internal');
      fixture.detectChanges();
      await fixture.whenStable();

      osdServiceMock.viewer.open.mockClear();

      component.afterFormatChange(true); // switch to PNG
      await fixture.whenStable();

      expect(component.isPng).toBe(true);
      expect(openedTileSource()).toEqual({ ...makeImageInfo('image.jp2'), preferredFormats: ['png'] });
    });
  });

  describe('ngOnDestroy', () => {
    it('destroys the viewer without error', async () => {
      component.resource = makeResource('internal');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(osdServiceMock.viewer.destroy).toHaveBeenCalled();
    });
  });
});
