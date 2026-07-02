import { TestBed } from '@angular/core/testing';
import { Constants } from '@dasch-swiss/dsp-js';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { IriLabelPair, Predicate } from '../../model';
import { Operator } from '../../operators.config';
import { makeIriLabelPair, makePredicate } from '../../testing/test-data-builders';
import { GravsearchService } from '../gravsearch.service';
import { OntologyDataService } from '../ontology-data.service';
import { SearchDerivationService } from '../search-derivation.service';
import { FilterParam, SearchUrlParams, SearchUrlSyncService } from '../search-url-sync.service';

/**
 * Phase 2 specs for the URL-derived search pipeline (DEV-6576). Drives the URL via a stubbed
 * `params$` and asserts the derived state / query. Also acts as the parallel-comparison harness:
 * the derived `gravsearchQuery$` is checked against the pure GravsearchService oracle, so the new
 * path can be trusted before Phase 3 flips the source of truth.
 */
const ONTO = 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2';

describe('SearchDerivationService (DEV-6576 Phase 2)', () => {
  let params$: BehaviorSubject<SearchUrlParams>;
  let service: SearchDerivationService;
  let gravsearch: GravsearchService;

  const bookClass: IriLabelPair = makeIriLabelPair(`${ONTO}#Book`, 'Book');
  const titlePred = makePredicate(`${ONTO}#hasTitle`, 'Title', Constants.TextValue, false);
  const authorPred = makePredicate(`${ONTO}#hasAuthor`, 'Author', `${ONTO}#Person`, true);
  const predicates: Predicate[] = [titlePred, authorPred];
  const classes: IriLabelPair[] = [bookClass];

  const encode = (filters: { predicateIri: string; operator: Operator; value: string; parentIndex?: number }[]) =>
    encodeURIComponent(JSON.stringify(filters));

  const urlSyncStub: Partial<SearchUrlSyncService> = {
    decodeFilters: (raw: string): FilterParam[] => {
      if (!raw) return [];
      return (JSON.parse(decodeURIComponent(raw)) as FilterParam[]).map(s => ({
        ...s,
        parentIndex: s.parentIndex ?? null,
      }));
    },
  };

  beforeEach(() => {
    params$ = new BehaviorSubject<SearchUrlParams>({});

    const ontologyStub: Partial<OntologyDataService> = {
      ontologyLoading$: of(false),
      resourceClasses$: of(classes),
      getProperties$: () => of(predicates),
      get selectedOntology() {
        return makeIriLabelPair(ONTO, 'webern-onto');
      },
      get classIris() {
        return [bookClass.iri];
      },
    };

    TestBed.configureTestingModule({
      providers: [
        SearchDerivationService,
        GravsearchService,
        { provide: SearchUrlSyncService, useValue: { ...urlSyncStub, params$ } },
        { provide: OntologyDataService, useValue: ontologyStub },
      ],
    });

    service = TestBed.inject(SearchDerivationService);
    gravsearch = TestBed.inject(GravsearchService);
  });

  describe('searchState$', () => {
    it('is empty for empty params', async () => {
      const state = await firstValueFrom(service.searchState$);
      expect(state).toEqual({ resourceClass: null, statements: [], orderByItems: [] });
    });

    it('resolves the resource class from the class param', async () => {
      params$.next({ class: bookClass.iri });
      const state = await firstValueFrom(service.searchState$);
      expect(state.resourceClass).toBe(bookClass);
    });

    it('hydrates statements from the filters param', async () => {
      params$.next({
        filters: encode([{ predicateIri: titlePred.iri, operator: Operator.Equals, value: 'Moby Dick' }]),
      });
      const state = await firstValueFrom(service.searchState$);
      expect(state.statements).toHaveLength(1);
      expect(state.statements[0].selectedPredicate).toBe(titlePred);
      expect(state.statements[0].selectedObjectValue).toBe('Moby Dick');
    });
  });

  describe('orderByItems$', () => {
    it('marks the item matching the orderBy param as active', async () => {
      params$.next({
        filters: encode([{ predicateIri: titlePred.iri, operator: Operator.Equals, value: 'x' }]),
        orderBy: titlePred.iri,
      });
      const items = await firstValueFrom(service.orderByItems$);
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(titlePred.iri);
      expect(items[0].orderBy).toBe(true);
    });

    it('flags link predicates as disabled for sorting', async () => {
      params$.next({
        filters: encode([{ predicateIri: authorPred.iri, operator: Operator.Exists, value: '' }]),
      });
      const items = await firstValueFrom(service.orderByItems$);
      expect(items[0].disabled).toBe(true);
    });

    it('produces no active item for a stale orderBy id not among the statements', async () => {
      params$.next({
        filters: encode([{ predicateIri: titlePred.iri, operator: Operator.Equals, value: 'x' }]),
        orderBy: 'http://x/removed',
      });
      const items = await firstValueFrom(service.orderByItems$);
      expect(items.some(i => i.orderBy)).toBe(false);
    });
  });

  describe('gravsearchQuery$', () => {
    it('is null when there is no fulltext, no valid filter, and no class', async () => {
      const query = await firstValueFrom(service.gravsearchQuery$);
      expect(query).toBeNull();
    });

    it('matches the pure GravsearchService oracle for a class + filter + fulltext URL', async () => {
      params$.next({
        q: 'whale',
        class: bookClass.iri,
        filters: encode([{ predicateIri: titlePred.iri, operator: Operator.Equals, value: 'Moby Dick' }]),
      });

      const derived = await firstValueFrom(service.gravsearchQuery$);
      const state = await firstValueFrom(service.searchState$);

      // Oracle: call the pure query fn with the same hydrated inputs.
      const oracle = gravsearch.generateGravSearchQuery(
        state.statements.filter(s => s.isValidAndComplete),
        'whale',
        bookClass.iri,
        state.orderByItems
      );

      expect(derived).toBe(oracle);
      expect(derived).toContain(`?mainRes a <${bookClass.iri}> .`);
      expect(derived).toContain('FILTER knora-api:matchText(?searchThis, "whale")');
    });

    it('emits ORDER BY on the active predicate when orderBy is set', async () => {
      params$.next({
        class: bookClass.iri,
        filters: encode([{ predicateIri: titlePred.iri, operator: Operator.Equals, value: 'x' }]),
        orderBy: titlePred.iri,
      });
      const query = await firstValueFrom(service.gravsearchQuery$);
      expect(query).toContain('ORDER BY ?res0');
    });
  });

  describe('loading$', () => {
    it('is false once ontology, classes, and predicates are ready', async () => {
      const loading = await firstValueFrom(service.loading$);
      expect(loading).toBe(false);
    });
  });
});
