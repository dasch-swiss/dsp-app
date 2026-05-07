import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { BehaviorSubject } from 'rxjs';
import { RegionService } from './representation/region.service';
import { ResourceImageComponent } from './resource-image.component';

const makeResource = (id = 'http://rdfh.ch/resource1'): DspResource =>
  ({
    res: {
      id,
      properties: { [Constants.HasStillImageFileValue]: [{ filename: 'image.jp2' }] },
    } as unknown as ReadResource,
  }) as unknown as DspResource;

describe('ResourceImageComponent — behavior', () => {
  let component: ResourceImageComponent;
  let fixture: ComponentFixture<ResourceImageComponent>;
  let regionServiceMock: jest.Mocked<
    Pick<RegionService, 'initialize' | 'showRegions' | 'selectRegion' | 'filterToRegion'>
  > & { regionsLoading$: BehaviorSubject<boolean> };

  beforeEach(async () => {
    regionServiceMock = {
      initialize: jest.fn(),
      showRegions: jest.fn(),
      selectRegion: jest.fn(),
      filterToRegion: jest.fn(),
      regionsLoading$: new BehaviorSubject<boolean>(false),
    };

    await TestBed.configureTestingModule({
      imports: [ResourceImageComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(ResourceImageComponent, {
        set: {
          template: '<div></div>',
          providers: [{ provide: RegionService, useValue: regionServiceMock }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResourceImageComponent);
    component = fixture.componentInstance;
  });

  describe('when a resource loads', () => {
    it('initializes the region service with the resource IRI', () => {
      component.resource = makeResource('http://rdfh.ch/img1');
      component.ngOnChanges();

      expect(regionServiceMock.initialize).toHaveBeenCalledWith('http://rdfh.ch/img1');
    });

    it('does not touch annotation state when there is no annotationIri', () => {
      component.resource = makeResource();
      component.annotationIri = null;
      component.ngOnChanges();

      expect(regionServiceMock.showRegions).not.toHaveBeenCalled();
      expect(regionServiceMock.selectRegion).not.toHaveBeenCalled();
    });
  });

  describe('when an annotationIri is provided', () => {
    const ANNOTATION = 'http://rdfh.ch/annotation1';

    beforeEach(() => {
      component.resource = makeResource();
      component.annotationIri = ANNOTATION;
      component.ngOnChanges();
    });

    it('shows regions immediately', () => {
      expect(regionServiceMock.showRegions).toHaveBeenCalledWith(true);
    });

    it('selects the annotation region immediately', () => {
      expect(regionServiceMock.selectRegion).toHaveBeenCalledWith(ANNOTATION);
    });

    it('filters and re-selects the annotation once regions finish loading', () => {
      // Simulate: loading starts (true) then finishes (false)
      regionServiceMock.regionsLoading$.next(true);
      regionServiceMock.regionsLoading$.next(false);

      expect(regionServiceMock.filterToRegion).toHaveBeenCalledWith(ANNOTATION);
      expect(regionServiceMock.selectRegion).toHaveBeenCalledWith(ANNOTATION);
    });

    it('does not filter again if loading completes a second time', () => {
      regionServiceMock.regionsLoading$.next(true);
      regionServiceMock.regionsLoading$.next(false);

      // Reset call counts
      regionServiceMock.filterToRegion.mockClear();
      regionServiceMock.selectRegion.mockClear();

      // Second loading cycle — take(1) should prevent this from triggering again
      regionServiceMock.regionsLoading$.next(true);
      regionServiceMock.regionsLoading$.next(false);

      expect(regionServiceMock.filterToRegion).not.toHaveBeenCalled();
    });
  });

  describe('when navigating from one image resource to another', () => {
    it('re-initializes the region service for the new resource', () => {
      component.resource = makeResource('http://rdfh.ch/img1');
      component.ngOnChanges();

      component.resource = makeResource('http://rdfh.ch/img2');
      component.ngOnChanges();

      expect(regionServiceMock.initialize).toHaveBeenNthCalledWith(1, 'http://rdfh.ch/img1');
      expect(regionServiceMock.initialize).toHaveBeenNthCalledWith(2, 'http://rdfh.ch/img2');
    });

    it('cancels any pending annotation subscription from the previous resource', () => {
      // Set up annotation subscription on first resource
      component.resource = makeResource('http://rdfh.ch/img1');
      component.annotationIri = 'http://rdfh.ch/annotation1';
      component.ngOnChanges();

      // Navigate to second resource — subscription should be cancelled
      component.resource = makeResource('http://rdfh.ch/img2');
      component.annotationIri = null;
      component.ngOnChanges();

      regionServiceMock.filterToRegion.mockClear();

      // Simulate first resource's loading completing — should NOT trigger filterToRegion
      regionServiceMock.regionsLoading$.next(true);
      regionServiceMock.regionsLoading$.next(false);

      expect(regionServiceMock.filterToRegion).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('completes without error', () => {
      component.resource = makeResource();
      component.ngOnChanges();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
