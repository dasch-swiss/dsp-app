import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { IriLabelPair } from '@dasch-swiss/vre/pages/search/search-filters';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { AdvancedSearchPageComponent } from '../advanced-search-page.component';
import { DerivedSearchState, DerivedSearchStateService } from '../service/derived-search-state.service';

describe('AdvancedSearchPageComponent', () => {
  const letterClass: IriLabelPair = {
    iri: 'http://0.0.0.0:3333/ontology/0001/anything/v2#Letter',
    labels: [{ language: 'en', value: 'Letter' }],
    comments: [],
  };

  let searchStateSubject: BehaviorSubject<DerivedSearchState>;
  let fixture: ComponentFixture<AdvancedSearchPageComponent>;
  let component: AdvancedSearchPageComponent;

  const renderComponent = (resourceClass: IriLabelPair | null) => {
    searchStateSubject = new BehaviorSubject<DerivedSearchState>({
      resourceClass,
      statements: [],
      orderByItems: [],
    });

    TestBed.configureTestingModule({
      imports: [AdvancedSearchPageComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ProjectPageService, useValue: { currentProjectUuid: 'uuid-0001' } },
        {
          provide: DerivedSearchStateService,
          useValue: {
            searchState$: searchStateSubject.asObservable(),
            gravsearchQuery$: of('WHERE { }'),
          },
        },
      ],
    });
    // The page is overridden at its own provider level, so the real search services are not needed.
    TestBed.overrideComponent(AdvancedSearchPageComponent, {
      set: { template: '', imports: [], providers: [] },
    });

    fixture = TestBed.createComponent(AdvancedSearchPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('resultsCanMixClasses', () => {
    it('should be true when no resource class restricts the query', () => {
      renderComponent(null);

      expect(component.resultsCanMixClasses()).toBe(true);
    });

    it('should be false when the query is restricted to one resource class', () => {
      renderComponent(letterClass);

      expect(component.resultsCanMixClasses()).toBe(false);
    });

    it('should follow the selected class as the user changes it', () => {
      renderComponent(null);
      expect(component.resultsCanMixClasses()).toBe(true);

      searchStateSubject.next({ resourceClass: letterClass, statements: [], orderByItems: [] });
      fixture.detectChanges();
      expect(component.resultsCanMixClasses()).toBe(false);

      // Picking "All resource classes" again clears the restriction, so the class becomes informative.
      searchStateSubject.next({ resourceClass: null, statements: [], orderByItems: [] });
      fixture.detectChanges();
      expect(component.resultsCanMixClasses()).toBe(true);
    });
  });
});
