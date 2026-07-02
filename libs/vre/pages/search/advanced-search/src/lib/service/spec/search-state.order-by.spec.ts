import { TestBed } from '@angular/core/testing';
import { OrderByItem } from '../../model';
import { SearchStateService } from '../search-state.service';

/**
 * Regression specs for the orderByItems$ emission contract (DEV-6576).
 *
 * The advanced-search order-by button, the URL write-back subscription, and
 * the Gravsearch re-emit all depend on `orderByItems$` firing whenever the
 * active sort changes. Two things had to be true for the click to work:
 *
 *   1. Callers must produce NEW OrderByItem references when a flag changes.
 *      In-place mutation is unfixable at the stream level: distinctUntilChanged
 *      holds the *same* object as its "previous" value, so mutating it makes
 *      previous and current compare equal and the change is invisible. This is
 *      why OrderByComponent builds new items rather than mutating.
 *   2. distinctUntilChanged must compare by value (id + orderBy), not by array
 *      reference, so a genuinely new array with a changed flag emits while an
 *      equal-by-value array does not.
 */
describe('SearchStateService — orderByItems$ emission (DEV-6576)', () => {
  let service: SearchStateService;

  const makeItem = (id: string, orderBy: boolean): OrderByItem =>
    new OrderByItem(id, [{ language: 'en', value: id }], false, orderBy);

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SearchStateService] });
    service = TestBed.inject(SearchStateService);
  });

  it('emits when the active orderBy flag changes via a new array', () => {
    const emissions: (boolean | undefined)[] = [];
    service.orderByItems$.subscribe(items => emissions.push(items[0]?.orderBy));

    service.updateOrderBy([makeItem('p1', false)]);
    service.updateOrderBy([makeItem('p1', true)]);

    // Initial replay is the empty INITIAL_FORMS_STATE.orderBy → undefined, then false, then true.
    expect(emissions).toEqual([undefined, false, true]);
  });

  it('emits when the active item changes to a different predicate (new references)', () => {
    service.updateOrderBy([makeItem('p1', true), makeItem('p2', false)]);

    const emissions: (string | undefined)[] = [];
    service.orderByItems$.subscribe(items => emissions.push(items.find(i => i.orderBy)?.id));

    // Switch the active sort from p1 to p2, producing fresh item references.
    service.updateOrderBy([makeItem('p1', false), makeItem('p2', true)]);

    expect(emissions).toEqual(['p1', 'p2']);
  });

  it('does NOT emit when the orderBy values are unchanged', () => {
    service.updateOrderBy([makeItem('p1', true)]);

    const emissions: boolean[] = [];
    service.orderByItems$.subscribe(items => emissions.push(!!items[0]?.orderBy));

    // Re-set with an equal-by-value (but new-reference) array: no change → no re-emit.
    service.updateOrderBy([makeItem('p1', true)]);

    expect(emissions).toEqual([true]); // only the replayed initial value
  });
});
