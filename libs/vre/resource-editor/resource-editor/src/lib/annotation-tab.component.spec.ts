import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { BehaviorSubject } from 'rxjs';
import { RegionService } from './representations/region.service';
import { AnnotationTabComponent } from './annotation-tab.component';

describe('AnnotationTabComponent', () => {
  let component: AnnotationTabComponent;
  let fixture: ComponentFixture<AnnotationTabComponent>;
  let selectedRegion$: BehaviorSubject<string | null>;
  let highlightedRegionClicked$: BehaviorSubject<string | null>;
  let regionServiceMock: jest.Mocked<Pick<RegionService, 'selectRegion' | 'selectedRegion$' | 'highlightedRegionClicked$' | 'regions$'>>;

  beforeEach(async () => {
    selectedRegion$ = new BehaviorSubject<string | null>(null);
    highlightedRegionClicked$ = new BehaviorSubject<string | null>(null);

    regionServiceMock = {
      selectRegion: jest.fn(),
      selectedRegion$: selectedRegion$.asObservable(),
      highlightedRegionClicked$: highlightedRegionClicked$.asObservable(),
      regions$: new BehaviorSubject([]).asObservable(),
    };

    await TestBed.configureTestingModule({
      imports: [AnnotationTabComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: RegionService, useValue: regionServiceMock },
        { provide: ChangeDetectorRef, useValue: { detectChanges: jest.fn() } },
      ],
    })
      .overrideComponent(AnnotationTabComponent, { set: { template: '<div></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(AnnotationTabComponent);
    component = fixture.componentInstance;
    component.resource = { id: 'http://r/parent' } as unknown as ReadResource;
    fixture.detectChanges(); // triggers ngAfterViewInit
  });

  describe('selectedRegion$ subscription', () => {
    it('updates selectedRegion when regionService emits', () => {
      selectedRegion$.next('http://r/1');

      expect(component.selectedRegion).toBe('http://r/1');
    });

    it('clears expandedRegion when selectedRegion differs', () => {
      component.expandedRegion = 'http://r/2';

      selectedRegion$.next('http://r/1');

      expect(component.expandedRegion).toBeNull();
    });

    it('keeps expandedRegion when selectedRegion matches', () => {
      component.expandedRegion = 'http://r/1';

      selectedRegion$.next('http://r/1');

      expect(component.expandedRegion).toBe('http://r/1');
    });
  });

  describe('highlightedRegionClicked$ subscription', () => {
    it('updates expandedRegion when regionService emits', () => {
      highlightedRegionClicked$.next('http://r/1');

      expect(component.expandedRegion).toBe('http://r/1');
    });
  });

  describe('onPanelOpened', () => {
    it('calls regionService.selectRegion with the IRI', () => {
      component.onPanelOpened('http://r/1');

      expect(regionServiceMock.selectRegion).toHaveBeenCalledWith('http://r/1');
    });
  });

  describe('onPanelClosed', () => {
    it('calls selectRegion(null) when closed panel is the selected region', () => {
      component.selectedRegion = 'http://r/1';

      component.onPanelClosed('http://r/1');

      expect(regionServiceMock.selectRegion).toHaveBeenCalledWith(null);
    });

    it('does NOT call selectRegion when closed panel is not the selected region', () => {
      component.selectedRegion = 'http://r/2';

      component.onPanelClosed('http://r/1');

      expect(regionServiceMock.selectRegion).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('completes subscriptions without error', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
