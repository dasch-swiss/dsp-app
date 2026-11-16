import { ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Constants, KnoraApiConnection, ReadResource, ReadStillImageFileValue } from '@dasch-swiss/dsp-js';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { of, Subject } from 'rxjs';
import { RegionService } from '../../representation/region.service';
import { OpenSeaDragonService } from './open-sea-dragon.service';
import { OsdDrawerService } from './osd-drawer.service';

// The file value states the native size; Sipi served the size-restricted image, whose aspect ratio
// differs slightly because its size is rounded to whole pixels.
const NATIVE = { x: 2613, y: 3505 };
const DRAWN = { x: 382, y: 512 };

const imageResource = {
  id: 'http://rdfh.ch/0803/page',
  properties: {
    [Constants.HasStillImageFileValue]: [{ dimX: NATIVE.x, dimY: NATIVE.y } as unknown as ReadStillImageFileValue],
  },
} as unknown as ReadResource;

const region = {
  id: 'http://rdfh.ch/0803/region',
  label: 'region',
  properties: {
    [Constants.HasGeometry]: [
      {
        geometry: {
          type: 'rectangle',
          lineColor: '#ff0000',
          lineWidth: 2,
          points: [
            { x: 0.9, y: 0.9 },
            { x: 0.99, y: 0.99 },
          ],
        },
      },
    ],
  },
} as unknown as ReadResource;

describe('OsdDrawerService — region overlays', () => {
  let addOverlay: jest.Mock;
  let service: OsdDrawerService;

  beforeEach(() => {
    const handlers: Record<string, () => void> = {};
    addOverlay = jest.fn();
    const osd = {
      viewer: {
        addHandler: jest.fn((event: string, handler: () => void) => (handlers[event] = handler)),
        addOverlay,
        removeOverlay: jest.fn(),
        clearOverlays: jest.fn(),
        world: { getItemAt: () => ({ getContentSize: () => DRAWN }) },
      },
      createdRectangle$: new Subject(),
    } as unknown as OpenSeaDragonService;
    const regionService = {
      showRegions$: of(true),
      regions$: of([{ res: region }]),
      selectedRegion$: of(null),
      selectedRegion: null,
    } as unknown as RegionService;

    service = new OsdDrawerService(
      {} as KnoraApiConnection,
      { detectChanges: jest.fn() } as unknown as ChangeDetectorRef,
      {} as MatDialog,
      osd,
      regionService,
      {} as ResourceService
    );
    service.onInit(imageResource);
    handlers['open'](); // OpenSeadragon has opened the image
  });

  afterEach(() => service.ngOnDestroy());

  it('places the overlay on the image OpenSeadragon drew, not on the native size of the file value', () => {
    const drawnAspectRatio = DRAWN.y / DRAWN.x;
    const { location, element } = addOverlay.mock.calls[0][0];

    expect(location.height).toBeCloseTo(drawnAspectRatio, 10);
    expect(element.getAttribute('viewBox')).toBe(`0 0 1 ${drawnAspectRatio}`);
  });

  it('scales the region geometry, stored as fractions of the image, by the drawn aspect ratio', () => {
    const rect = addOverlay.mock.calls[0][0].element.querySelector('rect');

    expect(Number(rect.getAttribute('y'))).toBeCloseTo(0.9 * (DRAWN.y / DRAWN.x), 10);
    expect(Number(rect.getAttribute('height'))).toBeCloseTo(0.09 * (DRAWN.y / DRAWN.x), 10);
  });
});
