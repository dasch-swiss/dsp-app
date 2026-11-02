import { TestBed } from '@angular/core/testing';
import { ListNodeV2WithAllLanguages, StringLiteralV2 } from '@dasch-swiss/dsp-js';
import { firstValueFrom, ReplaySubject } from 'rxjs';
import { DynamicFormsDataService } from '../dynamic-forms-data.service';
import { ListNodeLabelResolver } from '../list-node-label.resolver';

/**
 * Contract tests for the label resolver used by `ChipLabelPipe` under DEV-6857 — since the URL no longer
 * carries a per-chip `valueLabel` for list values, the chip needs a synchronous, cached label lookup
 * that survives language switches and does not re-fetch on each `pure: false` cycle.
 */
describe('ListNodeLabelResolver', () => {
  const ROOT_IRI = 'http://ex.org/lists/root';
  const CHILD_IRI = 'http://ex.org/lists/child';
  const GRANDCHILD_IRI = 'http://ex.org/lists/grandchild';

  const enDe = (value: string): StringLiteralV2[] => [
    { language: 'de', value: `${value}-de` },
    { language: 'en', value: `${value}-en` },
  ];

  // Build a two-deep list tree so we can assert recursive indexing.
  const listTree = (): ListNodeV2WithAllLanguages =>
    ({
      id: ROOT_IRI,
      labels: enDe('root'),
      children: [
        {
          id: CHILD_IRI,
          labels: enDe('child'),
          children: [
            { id: GRANDCHILD_IRI, labels: enDe('grandchild'), children: [] as ListNodeV2WithAllLanguages[] },
          ] as ListNodeV2WithAllLanguages[],
        } as ListNodeV2WithAllLanguages,
      ] as ListNodeV2WithAllLanguages[],
    }) as ListNodeV2WithAllLanguages;

  let resolver: ListNodeLabelResolver;
  let listSubject: ReplaySubject<ListNodeV2WithAllLanguages | undefined>;
  let getListSpy: jest.Mock;

  beforeEach(() => {
    // ReplaySubject so the resolver sees the same emission if the subscribe happens later than the
    // seeded `.next(...)` — matches the real HTTP-observable shape.
    listSubject = new ReplaySubject<ListNodeV2WithAllLanguages | undefined>(1);
    getListSpy = jest.fn(() => listSubject.asObservable());

    TestBed.configureTestingModule({
      providers: [
        ListNodeLabelResolver,
        { provide: DynamicFormsDataService, useValue: { getListWithAllLanguages$: getListSpy } },
      ],
    });
    resolver = TestBed.inject(ListNodeLabelResolver);
  });

  it('returns undefined and kicks off a single fetch on the first lookup', () => {
    expect(resolver.getLabels(ROOT_IRI, CHILD_IRI)).toBeUndefined();
    expect(getListSpy).toHaveBeenCalledTimes(1);
    expect(getListSpy).toHaveBeenCalledWith(ROOT_IRI);
  });

  it('does not re-issue the fetch on repeated lookups while it is in flight', () => {
    resolver.getLabels(ROOT_IRI, CHILD_IRI);
    resolver.getLabels(ROOT_IRI, GRANDCHILD_IRI);
    resolver.getLabels(ROOT_IRI, ROOT_IRI);
    expect(getListSpy).toHaveBeenCalledTimes(1);
  });

  it('indexes every node in the tree (root, children, and grandchildren) by IRI', () => {
    resolver.getLabels(ROOT_IRI, ROOT_IRI); // priming call
    listSubject.next(listTree());

    expect(resolver.getLabels(ROOT_IRI, ROOT_IRI)).toEqual(enDe('root'));
    expect(resolver.getLabels(ROOT_IRI, CHILD_IRI)).toEqual(enDe('child'));
    expect(resolver.getLabels(ROOT_IRI, GRANDCHILD_IRI)).toEqual(enDe('grandchild'));
  });

  it('emits changes$ once the tree is loaded so pure: false pipes can re-check', async () => {
    // `changes$` is a hot Subject (no replay), so a subscription set up before the load resolves
    // will receive the single "loaded" tick that follows the `.next(...)` below.
    const changes = firstValueFrom(resolver.changes$);
    resolver.getLabels(ROOT_IRI, ROOT_IRI);
    listSubject.next(listTree());
    await expect(changes).resolves.toBeUndefined();
  });

  it('returns undefined for an unknown node IRI even after the tree has loaded', () => {
    resolver.getLabels(ROOT_IRI, ROOT_IRI);
    listSubject.next(listTree());

    expect(resolver.getLabels(ROOT_IRI, 'http://ex.org/lists/does-not-exist')).toBeUndefined();
  });

  it('handles a failed fetch (undefined root) without throwing', () => {
    resolver.getLabels(ROOT_IRI, CHILD_IRI);
    listSubject.next(undefined);

    // Lookup still resolves to undefined; the resolver does not crash.
    expect(resolver.getLabels(ROOT_IRI, CHILD_IRI)).toBeUndefined();
  });

  it('lets a failed fetch be retried on a later lookup (no permanent stuck state)', () => {
    // DEV-6857 review: originally the in-flight flag was never cleared on an errored/undefined
    // response, so `getLabels` would silently return undefined forever and the chip would stay stuck
    // on the raw IRI fallback. The resolver must reset its in-flight guard so a later lookup — for
    // example after the user re-navigates or interacts — can retry.
    resolver.getLabels(ROOT_IRI, CHILD_IRI);
    listSubject.next(undefined);
    expect(getListSpy).toHaveBeenCalledTimes(1);

    // A retry (fresh ReplaySubject stand-in for a new HTTP call) succeeds and indexes the tree.
    const nextSubject = new ReplaySubject<ListNodeV2WithAllLanguages | undefined>(1);
    getListSpy.mockImplementationOnce(() => nextSubject.asObservable());
    resolver.getLabels(ROOT_IRI, CHILD_IRI);
    expect(getListSpy).toHaveBeenCalledTimes(2);
    nextSubject.next(listTree());
    expect(resolver.getLabels(ROOT_IRI, CHILD_IRI)).toEqual(enDe('child'));
  });
});
