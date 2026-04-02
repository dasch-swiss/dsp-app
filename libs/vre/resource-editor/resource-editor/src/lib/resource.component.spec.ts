import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Constants, KnoraApiConnection, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { BehaviorSubject, of } from 'rxjs';
import { CompoundService } from './compound/compound.service';
import { RegionService } from './representations/region.service';
import { PropertiesDisplayService } from './resource-properties/properties-display.service';
import { ResourceComponent } from './resource.component';
import { SegmentsService } from './segment-support/segments.service';

const makeReadResource = (withStillImage = false): ReadResource =>
  ({
    id: 'http://r/resource',
    properties: {
      ...(withStillImage ? { [Constants.HasStillImageFileValue]: [{ type: Constants.StillImageFileValue }] } : {}),
    },
  }) as unknown as ReadResource;

const makeDspResource = (readResource: ReadResource): DspResource =>
  ({ res: readResource, resProps: [] }) as unknown as DspResource;

describe('ResourceComponent', () => {
  let component: ResourceComponent;
  let fixture: ComponentFixture<ResourceComponent>;
  let regionServiceMock: jest.Mocked<
    Pick<RegionService, 'initialize' | 'showRegions' | 'selectRegion' | 'filterToRegion' | 'regionsLoading$'>
  >;
  let compoundServiceMock: jest.Mocked<Pick<CompoundService, 'reset' | 'onInit' | 'incomingResource'>>;
  let routeMock: { snapshot: { queryParamMap: { get: jest.Mock } } };
  let dspApiMock: { v2: { search: { doSearchStillImageRepresentationsCount: jest.Mock } } };
  let regionsLoading$: BehaviorSubject<boolean>;

  beforeEach(async () => {
    regionsLoading$ = new BehaviorSubject<boolean>(false);
    regionServiceMock = {
      initialize: jest.fn(),
      showRegions: jest.fn(),
      selectRegion: jest.fn(),
      filterToRegion: jest.fn(),
      regionsLoading$: regionsLoading$.asObservable(),
    };
    compoundServiceMock = {
      reset: jest.fn(),
      onInit: jest.fn(),
      incomingResource: { next: jest.fn() } as any,
    };
    routeMock = { snapshot: { queryParamMap: { get: jest.fn().mockReturnValue(null) } } };
    dspApiMock = {
      v2: { search: { doSearchStillImageRepresentationsCount: jest.fn().mockReturnValue(of({ numberOfResults: 0 })) } },
    };

    await TestBed.configureTestingModule({
      imports: [ResourceComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: DspApiConnectionToken, useValue: dspApiMock as unknown as KnoraApiConnection },
        { provide: ChangeDetectorRef, useValue: { detectChanges: jest.fn() } },
      ],
    })
      .overrideComponent(ResourceComponent, {
        set: {
          template: '<div></div>',
          // Override the component's own providers so TestBed mocks take effect
          providers: [
            { provide: RegionService, useFactory: () => regionServiceMock },
            { provide: CompoundService, useFactory: () => compoundServiceMock },
            { provide: PropertiesDisplayService, useValue: {} },
            { provide: SegmentsService, useValue: { onInit: jest.fn() } },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResourceComponent);
    component = fixture.componentInstance;
  });

  const triggerChanges = (resource: DspResource) => {
    component.resource = resource;
    component.ngOnChanges({ resource: new SimpleChange(null, resource, true) });
  };

  describe('ngOnChanges', () => {
    it('calls compoundService.reset()', () => {
      triggerChanges(makeDspResource(makeReadResource()));

      expect(compoundServiceMock.reset).toHaveBeenCalled();
    });

    it('sets resourceIsObjectWithoutRepresentation to true when no file value', () => {
      triggerChanges(makeDspResource(makeReadResource(false)));

      expect(component.resourceIsObjectWithoutRepresentation).toBe(true);
    });

    it('sets resourceIsObjectWithoutRepresentation to false when file value present', () => {
      triggerChanges(makeDspResource(makeReadResource(true)));

      expect(component.resourceIsObjectWithoutRepresentation).toBe(false);
    });
  });

  describe('still-image resource', () => {
    it('calls regionService.initialize with resource id', () => {
      triggerChanges(makeDspResource(makeReadResource(true)));

      expect(regionServiceMock.initialize).toHaveBeenCalledWith('http://r/resource');
    });
  });

  describe('resource without representation (compound navigation)', () => {
    it('calls doSearchStillImageRepresentationsCount', () => {
      triggerChanges(makeDspResource(makeReadResource(false)));

      expect(dspApiMock.v2.search.doSearchStillImageRepresentationsCount).toHaveBeenCalledWith('http://r/resource');
    });

    it('sets isCompoundNavigation to true when count > 0', () => {
      dspApiMock.v2.search.doSearchStillImageRepresentationsCount.mockReturnValue(of({ numberOfResults: 5 }));

      triggerChanges(makeDspResource(makeReadResource(false)));

      expect(component.isCompoundNavigation).toBe(true);
    });

    it('sets isCompoundNavigation to false when count is 0', () => {
      dspApiMock.v2.search.doSearchStillImageRepresentationsCount.mockReturnValue(of({ numberOfResults: 0 }));

      triggerChanges(makeDspResource(makeReadResource(false)));

      expect(component.isCompoundNavigation).toBe(false);
    });
  });

  describe('_checkForAnnotationUri', () => {
    it('sets annotationIri when query param is present', () => {
      routeMock.snapshot.queryParamMap.get.mockReturnValue('http://r/annotation1');

      triggerChanges(makeDspResource(makeReadResource(true)));

      expect(component.annotationIri).toBe('http://r/annotation1');
    });

    it('calls showRegions(true) and selectRegion when annotation param is present', () => {
      routeMock.snapshot.queryParamMap.get.mockReturnValue('http://r/annotation1');

      triggerChanges(makeDspResource(makeReadResource(true)));

      expect(regionServiceMock.showRegions).toHaveBeenCalledWith(true);
      expect(regionServiceMock.selectRegion).toHaveBeenCalledWith('http://r/annotation1');
    });

    it('leaves annotationIri null when query param is absent', () => {
      routeMock.snapshot.queryParamMap.get.mockReturnValue(null);

      triggerChanges(makeDspResource(makeReadResource(true)));

      expect(component.annotationIri).toBeNull();
    });

    it('calls filterToRegion and selectRegion after regionsLoading$ transitions true→false', () => {
      routeMock.snapshot.queryParamMap.get.mockReturnValue('http://r/annotation1');
      triggerChanges(makeDspResource(makeReadResource(true)));

      // Simulate loading true → false
      regionsLoading$.next(true);
      regionsLoading$.next(false);

      expect(regionServiceMock.filterToRegion).toHaveBeenCalledWith('http://r/annotation1');
      expect(regionServiceMock.selectRegion).toHaveBeenCalledWith('http://r/annotation1');
    });
  });

  describe('subscription management', () => {
    it('cancels previous regionsLoading$ subscription on subsequent ngOnChanges', () => {
      routeMock.snapshot.queryParamMap.get.mockReturnValue('http://r/annotation1');
      triggerChanges(makeDspResource(makeReadResource(true)));

      // Second ngOnChanges (no annotation) cancels first subscription
      routeMock.snapshot.queryParamMap.get.mockReturnValue(null);
      triggerChanges(makeDspResource(makeReadResource(true)));

      // Emit loading transition — filterToRegion should NOT be called (subscription was cancelled)
      regionServiceMock.filterToRegion.mockClear();
      regionsLoading$.next(true);
      regionsLoading$.next(false);

      expect(regionServiceMock.filterToRegion).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('completes without error', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});

describe('ResourceComponent — behavior', () => {
  let component: ResourceComponent;
  let fixture: ComponentFixture<ResourceComponent>;
  let regionServiceMock: jest.Mocked<
    Pick<RegionService, 'initialize' | 'showRegions' | 'selectRegion' | 'filterToRegion' | 'regionsLoading$'>
  >;
  let compoundServiceMock: jest.Mocked<Pick<CompoundService, 'reset' | 'onInit' | 'incomingResource'>>;
  let routeMock: { snapshot: { queryParamMap: { get: jest.Mock } } };
  let dspApiMock: { v2: { search: { doSearchStillImageRepresentationsCount: jest.Mock } } };
  let regionsLoading$: BehaviorSubject<boolean>;

  beforeEach(async () => {
    regionsLoading$ = new BehaviorSubject<boolean>(false);
    regionServiceMock = {
      initialize: jest.fn(),
      showRegions: jest.fn(),
      selectRegion: jest.fn(),
      filterToRegion: jest.fn(),
      regionsLoading$: regionsLoading$.asObservable(),
    };
    compoundServiceMock = {
      reset: jest.fn(),
      onInit: jest.fn(),
      incomingResource: { next: jest.fn() } as any,
    };
    routeMock = { snapshot: { queryParamMap: { get: jest.fn().mockReturnValue(null) } } };
    dspApiMock = {
      v2: { search: { doSearchStillImageRepresentationsCount: jest.fn().mockReturnValue(of({ numberOfResults: 0 })) } },
    };

    await TestBed.configureTestingModule({
      imports: [ResourceComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: DspApiConnectionToken, useValue: dspApiMock as unknown as KnoraApiConnection },
        { provide: ChangeDetectorRef, useValue: { detectChanges: jest.fn() } },
      ],
    })
      .overrideComponent(ResourceComponent, {
        set: {
          template: '<div></div>',
          providers: [
            { provide: RegionService, useFactory: () => regionServiceMock },
            { provide: CompoundService, useFactory: () => compoundServiceMock },
            { provide: PropertiesDisplayService, useValue: {} },
            { provide: SegmentsService, useValue: { onInit: jest.fn() } },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResourceComponent);
    component = fixture.componentInstance;
  });

  const triggerChanges = (resource: DspResource) => {
    component.resource = resource;
    component.ngOnChanges({ resource: new SimpleChange(null, resource, true) });
  };

  describe('annotation-only mode (?annotation=<iri> query param)', () => {
    describe('when the URL contains an annotation query param', () => {
      beforeEach(() => {
        routeMock.snapshot.queryParamMap.get.mockReturnValue('http://r/annotation1');
      });

      it('only the Annotations tab is visible (annotationIri is set, hiding other tabs)', () => {
        triggerChanges(makeDspResource(makeReadResource(true)));

        expect(component.annotationIri).toBe('http://r/annotation1');
      });

      it('the annotation matching the IRI is highlighted on the image', () => {
        triggerChanges(makeDspResource(makeReadResource(true)));

        expect(regionServiceMock.selectRegion).toHaveBeenCalledWith('http://r/annotation1');
      });

      it('regions are filtered to show only that one annotation after loading', () => {
        triggerChanges(makeDspResource(makeReadResource(true)));

        regionsLoading$.next(true);
        regionsLoading$.next(false);

        expect(regionServiceMock.filterToRegion).toHaveBeenCalledWith('http://r/annotation1');
      });

      it('regions load automatically without user interaction', () => {
        triggerChanges(makeDspResource(makeReadResource(true)));

        expect(regionServiceMock.showRegions).toHaveBeenCalledWith(true);
      });
    });

    describe('when the URL has no annotation query param', () => {
      it('all tabs are visible (annotationIri remains null)', () => {
        routeMock.snapshot.queryParamMap.get.mockReturnValue(null);

        triggerChanges(makeDspResource(makeReadResource(true)));

        expect(component.annotationIri).toBeNull();
      });
    });
  });

  describe('resource without a file representation', () => {
    it('when the resource has no image or media file, compound navigation is checked (may have child resources)', () => {
      dspApiMock.v2.search.doSearchStillImageRepresentationsCount.mockReturnValue(of({ numberOfResults: 3 }));

      triggerChanges(makeDspResource(makeReadResource(false)));

      expect(component.isCompoundNavigation).toBe(true);
    });
  });
});
