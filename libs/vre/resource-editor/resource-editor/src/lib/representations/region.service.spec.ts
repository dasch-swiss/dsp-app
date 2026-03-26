import { TestBed } from '@angular/core/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import * as appCommon from '@dasch-swiss/vre/shared/app-common';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { of } from 'rxjs';
import { RegionService } from './region.service';

// Spy on DspResource constructor and GenerateProperty to avoid needing real ReadResource shapes
jest.mock('@dasch-swiss/vre/shared/app-common', () => {
  const actual = jest.requireActual('@dasch-swiss/vre/shared/app-common');
  return {
    ...actual,
    DspResource: jest.fn().mockImplementation((res: any) => ({ res, resProps: [] })),
    GenerateProperty: { regionProperty: jest.fn().mockReturnValue([]) },
  };
});

const makeRegionResponse = (ids: string[], mayHaveMoreResults = false) => ({
  resources: ids.map(id => ({ id, label: id })),
  mayHaveMoreResults,
});

describe('RegionService', () => {
  let service: RegionService;
  let doSearchMock: jest.Mock;

  beforeEach(() => {
    doSearchMock = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        RegionService,
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: { search: { doSearchIncomingRegions: doSearchMock } },
          } as unknown as KnoraApiConnection,
        },
      ],
    });

    service = TestBed.inject(RegionService);
  });

  describe('initialize', () => {
    it('sets regionsLoading$ to true then false during load', () => {
      const loadingValues: boolean[] = [];
      service.regionsLoading$.subscribe(v => loadingValues.push(v));
      doSearchMock.mockReturnValue(of(makeRegionResponse(['http://r/1'], false)));

      service.initialize('http://example.org/resource');

      expect(loadingValues).toContain(true);
      expect(loadingValues[loadingValues.length - 1]).toBe(false);
    });
  });

  describe('updateRegions$', () => {
    it('calls doSearchIncomingRegions with resource id and offset 0', () => {
      doSearchMock.mockReturnValue(of(makeRegionResponse(['http://r/1'])));
      service.initialize('http://example.org/resource');
      doSearchMock.mockClear();
      doSearchMock.mockReturnValue(of(makeRegionResponse(['http://r/1'])));

      service.updateRegions$().subscribe();

      expect(doSearchMock).toHaveBeenCalledWith('http://example.org/resource', 0);
    });

    it('paginates when mayHaveMoreResults is true', () => {
      doSearchMock.mockReturnValue(of(makeRegionResponse([], false)));
      service.initialize('http://example.org/resource');
      doSearchMock.mockClear();

      doSearchMock
        .mockReturnValueOnce(of(makeRegionResponse(['http://r/1'], true)))
        .mockReturnValueOnce(of(makeRegionResponse(['http://r/2'], false)));

      service.updateRegions$().subscribe();

      expect(doSearchMock).toHaveBeenCalledTimes(2);
      expect(doSearchMock).toHaveBeenNthCalledWith(1, 'http://example.org/resource', 0);
      expect(doSearchMock).toHaveBeenNthCalledWith(2, 'http://example.org/resource', 1);
    });
  });

  describe('showRegions', () => {
    it('emits value on showRegions$', () => {
      const values: boolean[] = [];
      service.showRegions$.subscribe(v => values.push(v));

      service.showRegions(true);
      service.showRegions(false);

      expect(values).toEqual([false, true, false]);
    });
  });

  describe('selectRegion', () => {
    it('emits IRI on selectedRegion$', () => {
      let selected: string | null = 'initial';
      service.selectedRegion$.subscribe(v => (selected = v));

      service.selectRegion('http://r/1');

      expect(selected).toBe('http://r/1');
    });

    it('emits null when called with null', () => {
      let selected: string | null = 'initial';
      service.selectedRegion$.subscribe(v => (selected = v));

      service.selectRegion(null);

      expect(selected).toBeNull();
    });
  });

  describe('setHighlightedRegionClicked', () => {
    it('emits IRI on highlightedRegionClicked$', () => {
      let value: string | null = null;
      service.highlightedRegionClicked$.subscribe(v => (value = v));

      service.setHighlightedRegionClicked('http://r/1');

      expect(value).toBe('http://r/1');
    });
  });

  describe('filterToRegion', () => {
    it('narrows regions$ to only the matching IRI', () => {
      doSearchMock.mockReturnValue(of(makeRegionResponse(['http://r/1', 'http://r/2'])));
      service.initialize('http://example.org/resource');

      let regions: DspResource[] = [];
      service.regions$.subscribe(r => (regions = r));

      service.filterToRegion('http://r/1');

      expect(regions.every((r: any) => r.res.id === 'http://r/1')).toBe(true);
    });
  });
});
