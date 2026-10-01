import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ReadProject } from '@dasch-swiss/dsp-js';
import { RDFS_LABEL } from '@dasch-swiss/vre/pages/search/search-filters';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { DataClassUrlStateService } from '../data-class-url-state.service';
import { ProjectPageService } from '../project-page.service';

/**
 * The Data tab's half of the `SearchFilterState` contract. These specs cover the three places it
 * deliberately diverges from advanced search's URL service — a bare `orderDir`, the ontology and class
 * coming from the route path rather than query params, and replace-vs-push history granularity.
 */
const SHORTCODE = '0801';
const ONTO_IRI = `http://rdfh.ch/ontology/${SHORTCODE}/myonto/v2`;

describe('DataClassUrlStateService', () => {
  let service: DataClassUrlStateService;
  let navigate: jest.Mock;
  let queryParams$: BehaviorSubject<Record<string, string>>;
  let params$: BehaviorSubject<Record<string, string>>;

  const lastNav = () => navigate.mock.calls[navigate.mock.calls.length - 1][1];

  beforeEach(() => {
    navigate = jest.fn();
    queryParams$ = new BehaviorSubject<Record<string, string>>({});
    params$ = new BehaviorSubject<Record<string, string>>({ ontology: 'myonto', class: 'Book' });

    TestBed.configureTestingModule({
      providers: [
        DataClassUrlStateService,
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: { queryParams: queryParams$, params: params$ } },
        {
          provide: ProjectPageService,
          useValue: { currentProject$: of({ shortcode: SHORTCODE } as ReadProject) },
        },
        {
          provide: OntologyService,
          useValue: {
            getOntologyIriFromRoute: (shortcode: string, onto: string) =>
              `http://rdfh.ch/ontology/${shortcode}/${onto}/v2`,
            getClassIdFromParams: (shortcode: string, onto: string, cls: string) =>
              `http://rdfh.ch/ontology/${shortcode}/${onto}/v2#${cls}`,
          } as Partial<OntologyService>,
        },
      ],
    });
    service = TestBed.inject(DataClassUrlStateService);
  });

  describe('scope comes from the route path, not query params', () => {
    it('derives the ontology IRI from the route segment', async () => {
      expect(await firstValueFrom(service.ontologyIri$)).toBe(ONTO_IRI);
    });

    it('derives the resource class IRI from the route segments', async () => {
      expect(await firstValueFrom(service.resourceClassIri$)).toBe(`${ONTO_IRI}#Book`);
    });

    it('never writes ontology or class as query params', () => {
      service.setFilters([]);
      service.setSortDescending(true);
      service.setFulltextTerm('whale');

      for (const call of navigate.mock.calls) {
        expect(call[1].queryParams).not.toHaveProperty('ontology');
        expect(call[1].queryParams).not.toHaveProperty('class');
      }
    });
  });

  describe('sort direction stands alone', () => {
    it('treats a bare orderDir=desc as a descending sort', async () => {
      queryParams$.next({ orderDir: 'desc' });
      expect(await firstValueFrom(service.sortDescending$)).toBe(true);
    });

    it('counts a bare orderDir=desc as active state, so Reset shows', async () => {
      queryParams$.next({ orderDir: 'desc' });
      expect(await firstValueFrom(service.hasActiveState$)).toBe(true);
    });

    it('normalises an unrecognised direction away', async () => {
      queryParams$.next({ orderDir: 'sideways' });
      expect(await firstValueFrom(service.sortDescending$)).toBe(false);
      expect(await firstValueFrom(service.hasActiveState$)).toBe(false);
    });

    it('removes orderDir when sorting ascending, keeping the default out of the URL', () => {
      service.setSortDescending(false);
      expect(lastNav().queryParams).toEqual({ orderDir: null });
    });
  });

  describe('orderByItems$ speaks GravsearchService’s language', () => {
    it('maps a bare orderDir=desc onto a descending rdfs:label item', async () => {
      queryParams$.next({ orderDir: 'desc' });
      expect(await firstValueFrom(service.orderByItems$)).toEqual([
        expect.objectContaining({ id: RDFS_LABEL, direction: 'desc', orderBy: true }),
      ]);
    });

    it('emits the ascending item explicitly rather than an empty array', async () => {
      queryParams$.next({});
      expect(await firstValueFrom(service.orderByItems$)).toEqual([
        expect.objectContaining({ id: RDFS_LABEL, direction: 'asc', orderBy: true }),
      ]);
    });

    // `_getOrderByString` drops every item with `orderBy: false`, so an item that is not flagged
    // would silently fall through to the service default and a `desc` URL would sort ascending.
    it('always flags the item as active so the sort survives the orderBy filter', async () => {
      queryParams$.next({ orderDir: 'desc' });
      const [item] = await firstValueFrom(service.orderByItems$);
      expect(item.orderBy).toBe(true);
    });
  });

  describe('history granularity', () => {
    it('replaces rather than pushes for the debounced fulltext term', () => {
      service.setFulltextTerm('whale');
      expect(lastNav().replaceUrl).toBe(true);
    });

    it('pushes a history entry for a filter change', () => {
      service.setFilters([]);
      expect(lastNav().replaceUrl).toBe(false);
    });

    it('pushes a history entry for a sort change', () => {
      service.setSortDescending(true);
      expect(lastNav().replaceUrl).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears term, filters and sort in a single navigation', () => {
      service.reset();
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(lastNav().queryParams).toEqual({ q: null, filters: null, orderDir: null });
    });

    it('stays out of history', () => {
      service.reset();
      expect(lastNav().replaceUrl).toBe(true);
    });
  });

  describe('hasActiveState$', () => {
    it.each([
      ['nothing set', {}, false],
      ['a term', { q: 'whale' }, true],
      ['filters', { filters: '%5B%5D' }, true],
    ])('is %s -> %s', async (_label, params, expected) => {
      queryParams$.next(params as Record<string, string>);
      expect(await firstValueFrom(service.hasActiveState$)).toBe(expected);
    });
  });
});
