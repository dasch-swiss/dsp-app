import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ReadProject } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { provideSearchFilters, SearchFilterState } from '@dasch-swiss/vre/pages/search/search-filters';
import { OntologyService, ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { DataClassQueryService, provideDataClassSearch } from '../data-class-query.service';
import { DataClassUrlStateService } from '../data-class-url-state.service';
import { ProjectPageService } from '../project-page.service';

/** Resolves the provider graph `DataClassViewComponent` declares; every other spec uses doubles and would miss a missing provider. */
describe('DataClassViewComponent providers', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        ...provideSearchFilters(),
        ...provideDataClassSearch(),
        ResourceResultService,
        // Provided at app root in the real application.
        {
          provide: DspApiConnectionToken,
          useValue: { v2: { ontologyCache: { getOntology: () => of({}) }, onto: { getOntology: () => of({}) } } },
        },
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}) } },
        {
          provide: ProjectPageService,
          useValue: {
            currentProject$: new BehaviorSubject({
              shortcode: '0001',
              id: 'http://rdfh.ch/projects/0001',
            } as ReadProject),
          },
        },
        {
          provide: OntologyService,
          useValue: {
            getOntologyIriFromRoute: () => 'http://0.0.0.0:3333/ontology/0001/onto/v2',
            getClassIdFromParams: () => 'http://0.0.0.0:3333/ontology/0001/onto/v2#Thing',
            getIriBaseUrl: () => 'http://0.0.0.0:3333',
          },
        },
      ],
    });
  });

  it('resolves the query service, which transitively resolves everything provideSearchFilters supplies', () => {
    expect(TestBed.inject(DataClassQueryService)).toBeTruthy();
  });

  it('binds the SearchFilterState port to the same instance the page owns', () => {
    // `useExisting`, not `useClass`: two instances would split the chip bar's writes from the query's reads.
    expect(TestBed.inject(SearchFilterState)).toBe(TestBed.inject(DataClassUrlStateService));
  });
});
