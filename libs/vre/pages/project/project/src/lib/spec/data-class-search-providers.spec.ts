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

/**
 * Resolves the provider graph that `DataClassViewComponent` declares.
 *
 * Every other spec in this feature injects its collaborators as doubles, so none of them would
 * notice a provider missing from the real component — the Data tab would simply throw NullInjector
 * on first paint with a green suite behind it. This mounts nothing and asserts nothing about
 * behaviour; it exists so that adding a dependency without providing it fails here.
 */
describe('DataClassViewComponent providers', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        ...provideSearchFilters(),
        ...provideDataClassSearch(),
        ResourceResultService,
        // Provided at app root in the real application, so it has to be stood in for here.
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
    // `useExisting`, not `useClass`: two instances would have the chip bar writing to one URL service
    // while the query read another, and the symptom would be filters that change the address bar and
    // nothing else.
    expect(TestBed.inject(SearchFilterState)).toBe(TestBed.inject(DataClassUrlStateService));
  });
});
