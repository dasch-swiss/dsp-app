import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Operator } from '../../operators.config';
import { SearchFlowLogger } from '../search-flow-logger.service';
import { FilterParam, SearchUrlParams, SearchUrlSyncService } from '../search-url-sync.service';

/**
 * Phase 0 safety net for the URL-as-source-of-truth migration (DEV-6576).
 *
 * These specs pin the URL param CONTRACT so the migration cannot silently change
 * the encoding. Existing bookmarked/shared URLs must keep working, so the format
 * (`q`, `ontology`, `class`, `filters`, `orderBy`) and the filters encoding
 * (URI-encoded JSON) are treated as a stable public interface.
 *
 * Router/ActivatedRoute are stubbed: we assert what the service *reads from* and
 * *writes to* the router, not real navigation.
 */
describe('SearchUrlSyncService — URL param contract (DEV-6576 Phase 0)', () => {
  let service: SearchUrlSyncService;
  let navigateSpy: jest.Mock;
  let queryParams: Record<string, string>;
  let queryParams$: BehaviorSubject<Record<string, string>>;

  beforeEach(() => {
    navigateSpy = jest.fn();
    queryParams = {};
    queryParams$ = new BehaviorSubject<Record<string, string>>({});

    const routerStub = {
      navigate: navigateSpy,
      events: { pipe: () => ({ subscribe: () => ({ unsubscribe: () => undefined }) }) },
      lastSuccessfulNavigation: () => null,
    };
    const routeStub = {
      queryParams: queryParams$.asObservable(),
      snapshot: {
        get queryParams() {
          return queryParams;
        },
      },
    };

    TestBed.configureTestingModule({
      providers: [
        SearchUrlSyncService,
        SearchFlowLogger,
        { provide: Router, useValue: routerStub },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    });
    service = TestBed.inject(SearchUrlSyncService);
  });

  describe('encodeFilters / decodeFilters round-trip', () => {
    it('round-trips a single flat filter to an equivalent FilterParam', () => {
      const input = [{ predicateIri: 'http://x/hasTitle', operator: Operator.Equals, value: 'Moby Dick' }];

      const decoded = service.decodeFilters(service.encodeFilters(input));

      expect(decoded).toEqual<FilterParam[]>([
        { predicateIri: 'http://x/hasTitle', operator: Operator.Equals, value: 'Moby Dick', parentIndex: null },
      ]);
    });

    it('round-trips a linked-resource valueLabel alongside its IRI value (DEV-6576)', () => {
      const input = [
        {
          predicateIri: 'http://x/hasAuthor',
          operator: Operator.Equals,
          value: 'http://rdfh.ch/0801/abc',
          valueLabel: 'Rita',
        },
      ];

      const decoded = service.decodeFilters(service.encodeFilters(input));

      expect(decoded[0].value).toBe('http://rdfh.ch/0801/abc');
      expect(decoded[0].valueLabel).toBe('Rita');
    });

    it('drops an empty valueLabel to undefined (plain string values carry no label)', () => {
      const decoded = service.decodeFilters(
        service.encodeFilters([{ predicateIri: 'http://x/hasTitle', operator: Operator.Equals, value: 'Moby Dick' }])
      );

      expect(decoded[0].valueLabel).toBeUndefined();
    });

    it('round-trips nested filters preserving parentIndex', () => {
      const input = [
        { predicateIri: 'http://x/hasAuthor', operator: Operator.Exists, value: '' },
        { predicateIri: 'http://x/hasName', operator: Operator.Equals, value: 'Melville', parentIndex: 0 },
      ];

      const decoded = service.decodeFilters(service.encodeFilters(input));

      expect(decoded[0].parentIndex).toBeNull();
      expect(decoded[1].parentIndex).toBe(0);
      expect(decoded[1].predicateIri).toBe('http://x/hasName');
    });

    it('re-encoding the decoded value is stable (encode→decode→encode identity)', () => {
      const input = [
        { predicateIri: 'http://x/a', operator: Operator.IsLike, value: 'ab*c', parentIndex: undefined },
        { predicateIri: 'http://x/b', operator: Operator.Equals, value: 'plain', parentIndex: 0 },
      ];

      const once = service.encodeFilters(input);
      const decoded = service.decodeFilters(once);
      const twice = service.encodeFilters(
        decoded.map(d => ({
          predicateIri: d.predicateIri,
          operator: d.operator,
          value: d.value,
          parentIndex: d.parentIndex ?? undefined,
        }))
      );

      expect(twice).toBe(once);
    });

    it('preserves special characters in values through the URI-encoded JSON', () => {
      const value = 'quote " backslash \\ ampersand & slash /';
      const decoded = service.decodeFilters(
        service.encodeFilters([{ predicateIri: 'http://x/p', operator: Operator.Equals, value }])
      );

      expect(decoded[0].value).toBe(value);
    });

    it('decodes malformed input to an empty array rather than throwing', () => {
      expect(service.decodeFilters('%%%not-json%%%')).toEqual([]);
      expect(service.decodeFilters('')).toEqual([]);
    });

    it('drops entries with an unrecognised operator', () => {
      const raw = encodeURIComponent(
        JSON.stringify([
          { predicateIri: 'http://x/p', operator: 'equals', value: 'ok' },
          { predicateIri: 'http://x/p', operator: 'DROP TABLE', value: 'evil' },
        ])
      );
      const decoded = service.decodeFilters(raw);
      expect(decoded).toHaveLength(1);
      expect(decoded[0].value).toBe('ok');
    });

    it('drops entries missing or mistyping required string fields', () => {
      const raw = encodeURIComponent(
        JSON.stringify([
          { operator: 'equals', value: 'no-predicate' },
          { predicateIri: 'http://x/p', operator: 'equals', value: 42 },
          { predicateIri: 42, operator: 'equals', value: 'bad-predicate' },
        ])
      );
      expect(service.decodeFilters(raw)).toEqual([]);
    });

    it('returns an empty array when the decoded JSON is not an array', () => {
      expect(service.decodeFilters(encodeURIComponent(JSON.stringify({ predicateIri: 'x' })))).toEqual([]);
    });

    it('normalises a non-numeric parentIndex to null', () => {
      const raw = encodeURIComponent(
        JSON.stringify([{ predicateIri: 'http://x/p', operator: 'equals', value: 'v', parentIndex: 'nope' }])
      );
      expect(service.decodeFilters(raw)[0].parentIndex).toBeNull();
    });
  });

  describe('readParams', () => {
    it('maps present query params into SearchUrlParams', () => {
      queryParams = {
        q: 'whale',
        ontology: 'http://onto/v2',
        class: 'http://onto/v2#Book',
        filters: service.encodeFilters([{ predicateIri: 'http://x/p', operator: Operator.Equals, value: 'v' }]),
        orderBy: 'http://x/p',
      };

      const params = service.readParams();

      expect(params.q).toBe('whale');
      expect(params.ontology).toBe('http://onto/v2');
      expect(params.class).toBe('http://onto/v2#Book');
      expect(params.orderBy).toBe('http://x/p');
      expect(service.decodeFilters(params.filters!)[0].predicateIri).toBe('http://x/p');
    });

    it('treats empty-string params as undefined', () => {
      queryParams = { q: '', ontology: '', class: '', filters: '', orderBy: '' };

      expect(service.readParams()).toEqual<SearchUrlParams>({
        q: undefined,
        ontology: undefined,
        class: undefined,
        filters: undefined,
        orderBy: undefined,
      });
    });
  });

  describe('writeState', () => {
    it('writes only the provided keys and nulls empty values (for merge-based clearing)', () => {
      service.writeState({ orderBy: 'http://x/p' }, { replaceUrl: false });

      expect(navigateSpy).toHaveBeenCalledWith([], {
        queryParams: { orderBy: 'http://x/p' },
        queryParamsHandling: 'merge',
        replaceUrl: false,
      });
    });

    it('maps an undefined value to null so merge navigation removes the param', () => {
      service.writeState({ orderBy: undefined });

      const navArgs = navigateSpy.mock.calls[0][1];
      expect(navArgs.queryParams).toEqual({ orderBy: null });
    });

    it('defaults replaceUrl to true (continuous changes overwrite the entry)', () => {
      service.writeState({ q: 'x' });

      expect(navigateSpy.mock.calls[0][1].replaceUrl).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('nulls every known param and replaces the history entry (routed through writeState)', () => {
      service.clearAll();

      // Folded into the single write API (D5): merge + all-null = cleared, replaceUrl defaults true.
      expect(navigateSpy).toHaveBeenCalledWith([], {
        queryParams: { q: null, ontology: null, class: null, filters: null, orderBy: null, orderDir: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  });

  describe('params$', () => {
    it('decodes the current query params on subscribe', async () => {
      queryParams$.next({ q: 'whale', class: 'http://x#Book' });

      const params = await firstValueFrom(service.params$);

      expect(params.q).toBe('whale');
      expect(params.class).toBe('http://x#Book');
    });

    it('does not re-emit when the decoded shape is unchanged (Q9 no-op guard)', () => {
      const seen: SearchUrlParams[] = [];
      service.params$.subscribe(p => seen.push(p));

      queryParams$.next({ q: 'a' });
      queryParams$.next({ q: 'a' }); // identical decoded shape → suppressed

      expect(seen.map(p => p.q)).toEqual([undefined, 'a']); // initial {} then 'a', no duplicate
    });

    it('re-emits when a param actually changes', () => {
      const seen: (string | undefined)[] = [];
      service.params$.subscribe(p => seen.push(p.q));

      queryParams$.next({ q: 'a' });
      queryParams$.next({ q: 'b' });

      expect(seen).toEqual([undefined, 'a', 'b']);
    });
  });
});
