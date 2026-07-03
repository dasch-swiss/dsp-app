import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants } from '@dasch-swiss/dsp-js';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { IriLabelPair, Predicate } from '../../model';
import { Operator } from '../../operators.config';
import { makeIriLabelPair, makePredicate } from '../../testing/test-data-builders';
import { GravsearchService } from '../gravsearch.service';
import { OntologyDataService } from '../ontology-data.service';
import { SearchDerivationService } from '../search-derivation.service';
import { SearchFlowLogger } from '../search-flow-logger.service';
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

  // GravsearchService still sources the ontology IRI/short-code from OntologyDataService (by design —
  // ontology is URL-driven but not committed *form* state). Every ontology stub must supply it or the
  // query builder throws on `selectedOntology.iri`.
  const selectedOntology = makeIriLabelPair(ONTO, 'webern-onto');
  const ontologyStubBase = (overrides: Partial<OntologyDataService>): Partial<OntologyDataService> => ({
    ontologyLoading$: of(false),
    resourceClasses$: of(classes),
    getProperties$: () => of(predicates),
    get selectedOntology() {
      return selectedOntology;
    },
    get classIris() {
      return [bookClass.iri];
    },
    ...overrides,
  });

  beforeEach(() => {
    params$ = new BehaviorSubject<SearchUrlParams>({});

    const ontologyStub = ontologyStubBase({});

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

  // ---------------------------------------------------------------------------
  // P2.5 — gap tests that lock the safety net before the Phase-3 flip (DEV-6576).
  // G2 (loading$ blocking branches) and G3 (byte-identity oracle matrix) fit the
  // synchronous default harness; G1 (readiness gate blocks premature emission) and
  // G4 (real-service round-trip) use their own controllable stubs in nested blocks.
  // ---------------------------------------------------------------------------

  describe('loading$ blocking branches (G2)', () => {
    // These re-provide the ontology stub with one source flipped to the not-ready state.
    const buildWith = (ontologyStub: Partial<OntologyDataService>) => {
      TestBed.resetTestingModule();
      const p$ = new BehaviorSubject<SearchUrlParams>({});
      TestBed.configureTestingModule({
        providers: [
          SearchDerivationService,
          GravsearchService,
          { provide: SearchUrlSyncService, useValue: { ...urlSyncStub, params$: p$ } },
          { provide: OntologyDataService, useValue: ontologyStub },
        ],
      });
      return { svc: TestBed.inject(SearchDerivationService), p$ };
    };

    it('is true while the ontology is still loading', async () => {
      const { svc } = buildWith(ontologyStubBase({ ontologyLoading$: of(true) }));
      expect(await firstValueFrom(svc.loading$)).toBe(true);
    });

    it('is true while resource classes have not emitted yet (empty)', async () => {
      const { svc } = buildWith(ontologyStubBase({ resourceClasses$: of([]) }));
      expect(await firstValueFrom(svc.loading$)).toBe(true);
    });

    it('is true for a filter-bearing URL while only the synthetic seed predicate is present', async () => {
      const seedOnly = [
        makePredicate('http://api.knora.org/ontology/knora-api/v2#label', 'label', Constants.TextValue, false),
      ];
      const { svc, p$ } = buildWith(ontologyStubBase({ getProperties$: () => of(seedOnly) }));
      p$.next({ filters: encode([{ predicateIri: titlePred.iri, operator: Operator.Equals, value: 'x' }]) });
      expect(await firstValueFrom(svc.loading$)).toBe(true);
    });
  });

  describe('readiness gate blocks premature emission (G1)', () => {
    // Sources start not-ready and are flipped ready after subscription, proving the gate holds
    // until every dependency has settled — the property the synchronous `of(...)` stubs cannot test.
    let classes$: BehaviorSubject<IriLabelPair[]>;
    let predicates$: BehaviorSubject<Predicate[]>;
    let ontologyLoading$: BehaviorSubject<boolean>;
    let p$: BehaviorSubject<SearchUrlParams>;
    let svc: SearchDerivationService;

    beforeEach(() => {
      TestBed.resetTestingModule();
      classes$ = new BehaviorSubject<IriLabelPair[]>([]);
      predicates$ = new BehaviorSubject<Predicate[]>([
        makePredicate('http://api.knora.org/ontology/knora-api/v2#label', 'label', Constants.TextValue, false),
      ]);
      ontologyLoading$ = new BehaviorSubject<boolean>(true);
      p$ = new BehaviorSubject<SearchUrlParams>({
        class: bookClass.iri,
        filters: encode([{ predicateIri: titlePred.iri, operator: Operator.Equals, value: 'Moby Dick' }]),
      });

      TestBed.configureTestingModule({
        providers: [
          SearchDerivationService,
          GravsearchService,
          { provide: SearchUrlSyncService, useValue: { ...urlSyncStub, params$: p$ } },
          {
            provide: OntologyDataService,
            useValue: ontologyStubBase({
              ontologyLoading$,
              resourceClasses$: classes$,
              getProperties$: () => predicates$,
            }),
          },
        ],
      });
      svc = TestBed.inject(SearchDerivationService);
    });

    it('does not settle the query until classes and predicates are hydrated', () => {
      const emissions: (string | null)[] = [];
      const sub = svc.gravsearchQuery$.subscribe(q => emissions.push(q));

      // Ontology reports loaded, but classes/predicates are still the not-ready seed.
      ontologyLoading$.next(false);
      const beforeReady = [...emissions];

      // Now hydrate the sources.
      classes$.next(classes);
      predicates$.next(predicates);

      // The query should reflect the fully-hydrated filter (a real query, not the empty/premature one).
      const settled = emissions[emissions.length - 1];
      sub.unsubscribe();

      // Before hydration, no emission carried the hydrated filter.
      expect(beforeReady.every(q => !q || !q.includes('Moby Dick'))).toBe(true);
      expect(settled).toContain('Moby Dick');
    });

    it('reports loading true until every source is ready, then false', () => {
      const states: boolean[] = [];
      const sub = svc.loading$.subscribe(v => states.push(v));

      ontologyLoading$.next(false); // still blocked: classes empty
      classes$.next(classes); // still blocked: only seed predicate + filters present
      predicates$.next(predicates); // now ready
      sub.unsubscribe();

      expect(states[0]).toBe(true);
      expect(states[states.length - 1]).toBe(false);
    });
  });

  describe('byte-identity oracle matrix (G3)', () => {
    // For each URL shape, the URL-derived query must equal the pure GravsearchService applied to the
    // same hydrated inputs. This runs the rich value-type / nesting / escaping matrix — which today
    // lives only in the pure gravsearch spec — through the URL-derived path.
    const listPred = makePredicate(
      `${ONTO}#hasCategory`,
      'Category',
      Constants.ListValue,
      false,
      `${ONTO}#categoryList`
    );
    const yearPred = makePredicate(`${ONTO}#hasYear`, 'Year', Constants.IntValue, false);

    const oracleFor = async (): Promise<{ derived: string | null; oracle: string | null }> => {
      const derived = await firstValueFrom(service.gravsearchQuery$);
      const state = await firstValueFrom(service.searchState$);
      const fulltext = params$.value.q ?? '';
      const validStatements = state.statements.filter(s => s.isValidAndComplete);
      const hasAnything = !!fulltext || validStatements.length > 0 || !!state.resourceClass?.iri;
      const oracle = hasAnything
        ? gravsearch.generateGravSearchQuery(
            validStatements,
            fulltext,
            state.resourceClass?.iri ?? '',
            state.orderByItems
          )
        : null;
      return { derived, oracle };
    };

    beforeEach(() => {
      // Re-provide with the extended predicate set so list/int filters hydrate.
      TestBed.resetTestingModule();
      params$ = new BehaviorSubject<SearchUrlParams>({});
      TestBed.configureTestingModule({
        providers: [
          SearchDerivationService,
          GravsearchService,
          { provide: SearchUrlSyncService, useValue: { ...urlSyncStub, params$ } },
          {
            provide: OntologyDataService,
            useValue: ontologyStubBase({ getProperties$: () => of([titlePred, authorPred, listPred, yearPred]) }),
          },
        ],
      });
      service = TestBed.inject(SearchDerivationService);
      gravsearch = TestBed.inject(GravsearchService);
    });

    it('nested / child filters', async () => {
      params$.next({
        class: bookClass.iri,
        filters: encode([
          { predicateIri: authorPred.iri, operator: Operator.Exists, value: '' },
          { predicateIri: titlePred.iri, operator: Operator.Equals, value: 'Ishmael', parentIndex: 0 },
        ]),
      });
      const { derived, oracle } = await oracleFor();
      expect(derived).toBe(oracle);
    });

    it('list value type', async () => {
      params$.next({
        class: bookClass.iri,
        filters: encode([{ predicateIri: listPred.iri, operator: Operator.Equals, value: `${ONTO}#node1` }]),
      });
      const { derived, oracle } = await oracleFor();
      expect(derived).toBe(oracle);
    });

    it('int value type with a numeric operator', async () => {
      params$.next({
        class: bookClass.iri,
        filters: encode([{ predicateIri: yearPred.iri, operator: Operator.GreaterThan, value: '1850' }]),
      });
      const { derived, oracle } = await oracleFor();
      expect(derived).toBe(oracle);
    });

    it('link value type', async () => {
      params$.next({
        class: bookClass.iri,
        filters: encode([{ predicateIri: authorPred.iri, operator: Operator.Exists, value: '' }]),
      });
      const { derived, oracle } = await oracleFor();
      expect(derived).toBe(oracle);
    });

    it('escaping: quote / backslash / regex metacharacters survive URL → query', async () => {
      params$.next({
        class: bookClass.iri,
        filters: encode([{ predicateIri: titlePred.iri, operator: Operator.Matches, value: 'a"b\\c.*[x]' }]),
      });
      const { derived, oracle } = await oracleFor();
      expect(derived).toBe(oracle);
    });

    it('orderBy-active on a sortable predicate', async () => {
      params$.next({
        class: bookClass.iri,
        filters: encode([{ predicateIri: titlePred.iri, operator: Operator.Equals, value: 'x' }]),
        orderBy: titlePred.iri,
      });
      const { derived, oracle } = await oracleFor();
      expect(derived).toBe(oracle);
      expect(derived).toContain('ORDER BY');
    });

    it('class-less fulltext-only (UNION over all classes)', async () => {
      params$.next({ q: 'whale' });
      const { derived, oracle } = await oracleFor();
      expect(derived).toBe(oracle);
      expect(derived).toContain('whale');
    });
  });

  describe('real-service round-trip (G4)', () => {
    // Uses the REAL SearchUrlSyncService.encodeFilters/decodeFilters (not the ad-hoc stub) driven by a
    // controllable queryParams stream, proving the two halves of "URL is the source of truth" compose:
    // encodeFilters (real) → URL → params$ (real) → searchState$ → gravsearchQuery$.
    let queryParams$: BehaviorSubject<Record<string, string>>;
    let svc: SearchDerivationService;
    let urlSync: SearchUrlSyncService;
    let grav: GravsearchService;

    beforeEach(() => {
      TestBed.resetTestingModule();
      queryParams$ = new BehaviorSubject<Record<string, string>>({});
      TestBed.configureTestingModule({
        providers: [
          SearchDerivationService,
          GravsearchService,
          SearchUrlSyncService,
          {
            provide: Router,
            useValue: { events: of(), lastSuccessfulNavigation: () => null, navigate: () => Promise.resolve(true) },
          },
          {
            provide: ActivatedRoute,
            useValue: { queryParams: queryParams$, snapshot: { queryParams: {} } },
          },
          {
            provide: SearchFlowLogger,
            useValue: { urlRead: () => {}, urlWrite: () => {}, urlClear: () => {} },
          },
          { provide: OntologyDataService, useValue: ontologyStubBase({}) },
        ],
      });
      svc = TestBed.inject(SearchDerivationService);
      urlSync = TestBed.inject(SearchUrlSyncService);
      grav = TestBed.inject(GravsearchService);
    });

    it('encodeFilters (real) → params$ → searchState$ → gravsearchQuery$ produces the expected query', async () => {
      const filters = urlSync.encodeFilters([
        { predicateIri: titlePred.iri, operator: Operator.Equals, value: 'Moby Dick' },
      ]);
      queryParams$.next({ class: bookClass.iri, filters, q: 'whale' });

      const derived = await firstValueFrom(svc.gravsearchQuery$);
      const state = await firstValueFrom(svc.searchState$);
      const oracle = grav.generateGravSearchQuery(
        state.statements.filter(s => s.isValidAndComplete),
        'whale',
        bookClass.iri,
        state.orderByItems
      );

      expect(derived).toBe(oracle);
      expect(derived).toContain('Moby Dick');
      expect(derived).toContain('whale');
    });
  });

  describe('ontology-param reaction (T3a / Phase 3a)', () => {
    // The service reacts to `params.ontology` in its constructor, calling `setOntology` when the URL
    // names a different ontology than the one loaded. Built here with a `setOntology` spy and a
    // mutable `selectedOntology.iri` so we can assert the de-dup / diff logic.
    let setOntology: jest.Mock;
    let currentOntologyIri: string;
    let p$: BehaviorSubject<SearchUrlParams>;

    const buildService = () => {
      TestBed.resetTestingModule();
      p$ = new BehaviorSubject<SearchUrlParams>({});
      setOntology = jest.fn();
      const stub: Partial<OntologyDataService> = {
        ...ontologyStubBase({}),
        setOntology,
        get selectedOntology() {
          return makeIriLabelPair(currentOntologyIri, 'current');
        },
      };
      TestBed.configureTestingModule({
        providers: [
          SearchDerivationService,
          GravsearchService,
          { provide: SearchUrlSyncService, useValue: { ...urlSyncStub, params$: p$ } },
          { provide: OntologyDataService, useValue: stub },
        ],
      });
      TestBed.inject(SearchDerivationService); // constructor wires the reaction
    };

    it('calls setOntology once when the ontology param differs from the loaded one', () => {
      currentOntologyIri = ONTO;
      buildService();
      const other = `${ONTO}-other`;

      p$.next({ ontology: other });

      expect(setOntology).toHaveBeenCalledTimes(1);
      expect(setOntology).toHaveBeenCalledWith(other);
    });

    it('does not call setOntology when the ontology param equals the loaded one (de-dup)', () => {
      currentOntologyIri = ONTO;
      buildService();

      p$.next({ ontology: ONTO });

      expect(setOntology).not.toHaveBeenCalled();
    });

    it('does not re-trigger setOntology when the ontology param is unchanged across emissions', () => {
      currentOntologyIri = ONTO;
      buildService();
      const other = `${ONTO}-other`;

      p$.next({ ontology: other });
      p$.next({ ontology: other, q: 'whale' }); // ontology unchanged, other param changed

      expect(setOntology).toHaveBeenCalledTimes(1);
    });

    it('does not call setOntology when the URL has no ontology param', () => {
      currentOntologyIri = ONTO;
      buildService();

      p$.next({ class: bookClass.iri });

      expect(setOntology).not.toHaveBeenCalled();
    });
  });
});
