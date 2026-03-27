import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { CompoundService } from './compound/compound.service';
import { RegionService } from './representations/region.service';
import { Segment } from './segment-support/segment';
import { SegmentsService } from './segment-support/segments.service';
import { ResourceTabsComponent } from './resource-tabs.component';

const makeResource = (withStillImage = false): DspResource => {
  const res = {
    id: 'http://r/resource',
    properties: withStillImage ? { [Constants.HasStillImageFileValue]: [{}] } : {},
  } as unknown as ReadResource;
  return { res, resProps: [] } as unknown as DspResource;
};

describe('ResourceTabsComponent', () => {
  let component: ResourceTabsComponent;
  let fixture: ComponentFixture<ResourceTabsComponent>;
  let selectedRegion$: BehaviorSubject<string | null>;
  let regions$: BehaviorSubject<DspResource[]>;
  let highlightSegment$: BehaviorSubject<Segment | null>;
  let incomingResource$: BehaviorSubject<DspResource | undefined>;
  let regionServiceMock: jest.Mocked<Pick<RegionService, 'selectedRegion$' | 'regions$' | 'showRegions' | 'regionsLoading$'>>;
  let segmentsServiceMock: jest.Mocked<Pick<SegmentsService, 'segments' | 'highlightSegment$'>>;
  let compoundServiceMock: jest.Mocked<Pick<CompoundService, 'incomingResource$'>>;

  beforeEach(async () => {
    selectedRegion$ = new BehaviorSubject<string | null>(null);
    regions$ = new BehaviorSubject<DspResource[]>([]);
    highlightSegment$ = new BehaviorSubject<Segment | null>(null);
    incomingResource$ = new BehaviorSubject<DspResource | undefined>(undefined);

    regionServiceMock = {
      selectedRegion$: selectedRegion$.asObservable(),
      regions$: regions$.asObservable(),
      showRegions: jest.fn(),
      regionsLoading$: of(false),
    };
    segmentsServiceMock = {
      segments: [],
      highlightSegment$: highlightSegment$.asObservable(),
    };
    compoundServiceMock = {
      incomingResource$: incomingResource$.asObservable(),
    };

    await TestBed.configureTestingModule({
      imports: [ResourceTabsComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideTranslateService(),
        { provide: RegionService, useValue: regionServiceMock },
        { provide: SegmentsService, useValue: segmentsServiceMock },
        { provide: CompoundService, useValue: compoundServiceMock },
        { provide: ChangeDetectorRef, useValue: { detectChanges: jest.fn() } },
      ],
    })
      .overrideComponent(ResourceTabsComponent, { set: { template: '<div></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(ResourceTabsComponent);
    component = fixture.componentInstance;
    component.resource = makeResource();
    fixture.detectChanges(); // triggers ngOnInit
  });

  describe('displayAnnotations', () => {
    it('returns false when regionsCount is 0', () => {
      component.regionsCount = 0;
      component.resource = makeResource(true);

      expect(component.displayAnnotations).toBe(false);
    });

    it('returns true when still-image resource and regionsCount > 0', () => {
      component.regionsCount = 2;
      component.resource = makeResource(true);

      expect(component.displayAnnotations).toBe(true);
    });

    it('returns falsy when no still-image file and no incomingResource', () => {
      component.regionsCount = 5;
      component.resource = makeResource(false);
      component.incomingResource = undefined;

      expect(component.displayAnnotations).toBeFalsy();
    });
  });

  describe('regionsCount', () => {
    it('updates when regionService.regions$ emits', () => {
      regions$.next([{} as DspResource, {} as DspResource]);

      expect(component.regionsCount).toBe(2);
    });
  });

  describe('selectedTab — selectedRegion$ subscription', () => {
    it('sets selectedTab to 2 when annotationIri is NOT set and region emits', () => {
      component.annotationIri = null;

      selectedRegion$.next('http://r/1');

      expect(component.selectedTab).toBe(2);
    });

    it('sets selectedTab to 0 when annotationIri IS set and region emits', () => {
      component.annotationIri = 'http://r/1';

      selectedRegion$.next('http://r/1');

      expect(component.selectedTab).toBe(0);
    });
  });

  describe('selectedTab — highlightSegment$ subscription', () => {
    it('sets selectedTab to 1 when a segment is highlighted', () => {
      highlightSegment$.next({ label: 'seg' } as unknown as Segment);

      expect(component.selectedTab).toBe(1);
    });
  });

  describe('onTabChange', () => {
    it('calls showRegions(true) when switching to annotation tab (index 2, no annotationIri)', () => {
      component.annotationIri = null;
      component.incomingResource = undefined;

      component.onTabChange({ index: 1 });

      expect(regionServiceMock.showRegions).toHaveBeenCalledWith(true);
    });

    it('calls showRegions(false) when switching to non-annotation tab', () => {
      component.onTabChange({ index: 0 });

      expect(regionServiceMock.showRegions).toHaveBeenCalledWith(false);
    });

    it('calls showRegions(true) for index 0 when annotationIri is set', () => {
      component.annotationIri = 'http://r/annotation';

      component.onTabChange({ index: 0 });

      expect(regionServiceMock.showRegions).toHaveBeenCalledWith(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('unsubscribes without error', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});

describe('ResourceTabsComponent — behavior', () => {
  let component: ResourceTabsComponent;
  let fixture: ComponentFixture<ResourceTabsComponent>;
  let selectedRegion$: BehaviorSubject<string | null>;
  let regions$: BehaviorSubject<DspResource[]>;
  let highlightSegment$: BehaviorSubject<Segment | null>;
  let incomingResource$: BehaviorSubject<DspResource | undefined>;
  let regionServiceMock: jest.Mocked<Pick<RegionService, 'selectedRegion$' | 'regions$' | 'showRegions' | 'regionsLoading$'>>;
  let segmentsServiceMock: jest.Mocked<Pick<SegmentsService, 'segments' | 'highlightSegment$'>>;
  let compoundServiceMock: jest.Mocked<Pick<CompoundService, 'incomingResource$'>>;

  beforeEach(async () => {
    selectedRegion$ = new BehaviorSubject<string | null>(null);
    regions$ = new BehaviorSubject<DspResource[]>([]);
    highlightSegment$ = new BehaviorSubject<Segment | null>(null);
    incomingResource$ = new BehaviorSubject<DspResource | undefined>(undefined);

    regionServiceMock = {
      selectedRegion$: selectedRegion$.asObservable(),
      regions$: regions$.asObservable(),
      showRegions: jest.fn(),
      regionsLoading$: of(false),
    };
    segmentsServiceMock = {
      segments: [],
      highlightSegment$: highlightSegment$.asObservable(),
    };
    compoundServiceMock = {
      incomingResource$: incomingResource$.asObservable(),
    };

    await TestBed.configureTestingModule({
      imports: [ResourceTabsComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideTranslateService(),
        { provide: RegionService, useValue: regionServiceMock },
        { provide: SegmentsService, useValue: segmentsServiceMock },
        { provide: CompoundService, useValue: compoundServiceMock },
        { provide: ChangeDetectorRef, useValue: { detectChanges: jest.fn() } },
      ],
    })
      .overrideComponent(ResourceTabsComponent, { set: { template: '<div></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(ResourceTabsComponent);
    component = fixture.componentInstance;
    component.resource = makeResource();
    fixture.detectChanges();
  });

  describe('tab visibility', () => {
    it('Annotations tab appears only when the resource is a still image with annotations', () => {
      component.resource = makeResource(true);
      component.regionsCount = 3;

      expect(component.displayAnnotations).toBe(true);
    });

    it('Annotations tab is hidden when the image has no annotations yet', () => {
      component.resource = makeResource(true);
      component.regionsCount = 0;

      expect(component.displayAnnotations).toBe(false);
    });

    it('annotation count badge shows the number of annotations', () => {
      regions$.next([{} as DspResource, {} as DspResource, {} as DspResource]);

      expect(component.regionsCount).toBe(3);
    });
  });

  describe('automatic tab switching', () => {
    it('the Annotations tab becomes active when an annotation is selected (e.g. clicked on the image)', () => {
      component.annotationIri = null;

      selectedRegion$.next('http://r/1');

      expect(component.selectedTab).toBe(2);
    });

    it('the Segments tab becomes active when a media segment is highlighted (e.g. during playback)', () => {
      highlightSegment$.next({ label: 'seg' } as unknown as Segment);

      expect(component.selectedTab).toBe(1);
    });
  });

  describe('annotation visibility', () => {
    it('annotations become visible on the image when the user switches to the Annotations tab', () => {
      component.annotationIri = null;
      component.incomingResource = undefined;

      component.onTabChange({ index: 1 });

      expect(regionServiceMock.showRegions).toHaveBeenCalledWith(true);
    });

    it('annotations are hidden from the image when the user switches away from the Annotations tab', () => {
      component.onTabChange({ index: 0 });

      expect(regionServiceMock.showRegions).toHaveBeenCalledWith(false);
    });
  });
});
