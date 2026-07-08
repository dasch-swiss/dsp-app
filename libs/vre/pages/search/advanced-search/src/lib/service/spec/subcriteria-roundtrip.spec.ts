import { TestBed } from '@angular/core/testing';
import { Constants } from '@dasch-swiss/dsp-js';
import { EMPTY } from 'rxjs';
import { IriLabelPair, StatementElement } from '../../model';
import { Operator } from '../../operators.config';
import { makeIriLabelPair, makePredicate } from '../../testing/test-data-builders';
import { buildStatementsFromFilterParams } from '../../util/build-statements';
import { DerivedSearchStateService } from '../derived-search-state.service';
import { StatementDraftStore } from '../statement-draft.store';

// Pins the add-filter → write-to-URL → reconstruct round-trip for a link + Matches sub-query with one
// subcriterion: the subcriterion must be flattened into the filter args (with parentIndex) and rebuilt
// as a child on reconstruction. Guards against the subcriterion being dropped on the way to/from the URL.
describe('subcriteria round-trip', () => {
  let store: StatementDraftStore;

  const personClass: IriLabelPair = makeIriLabelPair('http://x/Person', 'Person');
  const authorPred = makePredicate('http://x/hasAuthor', 'Author', 'http://x/Person', true);
  const namePred = makePredicate('http://x/hasName', 'Name', Constants.TextValue, false);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StatementDraftStore,
        { provide: DerivedSearchStateService, useValue: { searchState$: EMPTY } as Partial<DerivedSearchStateService> },
      ],
    });
    store = TestBed.inject(StatementDraftStore);
  });

  // Mirror of AdvancedSearchBarComponent._writeFiltersToUrl's filterArgs construction.
  const buildFilterArgs = (confirmed: StatementElement[]) => {
    const stmts = confirmed.flatMap(stmt => [stmt, ...store.descendantsOf(stmt)]);
    const idxById = new Map(stmts.map((s, i) => [s.id, i]));
    return stmts.map(stmt => ({
      predicateIri: stmt.selectedPredicate!.iri,
      operator: stmt.selectedOperator!,
      value: stmt.selectedObjectWriteValue ?? '',
      valueLabel: stmt.selectedObjectLabel,
      parentIndex: stmt.parentId !== undefined ? idxById.get(stmt.parentId) : undefined,
    }));
  };

  it('flattens the parent + subcriterion into two filter args', () => {
    const parent = store.currentStatements[0];
    store.setSelectedPredicate(parent, authorPred);
    store.setSelectedOperator(parent, Operator.Matches);
    store.setObjectValue(parent, personClass);

    const child = store.addChildStatement(parent);
    store.setSelectedPredicate(child, namePred);
    store.setSelectedOperator(child, Operator.IsLike);
    store.setObjectValue(child, 'Rita');

    expect(store.descendantsOf(parent)).toHaveLength(1);

    const args = buildFilterArgs([parent]);
    expect(args).toHaveLength(2);
    expect(args[1]).toMatchObject({
      predicateIri: namePred.iri,
      operator: Operator.IsLike,
      value: 'Rita',
      parentIndex: 0,
    });
  });

  it('reconstructs the subcriterion from the flattened args (parentIndex wiring)', () => {
    const parent = store.currentStatements[0];
    store.setSelectedPredicate(parent, authorPred);
    store.setSelectedOperator(parent, Operator.Matches);
    store.setObjectValue(parent, personClass);
    const child = store.addChildStatement(parent);
    store.setSelectedPredicate(child, namePred);
    store.setSelectedOperator(child, Operator.IsLike);
    store.setObjectValue(child, 'Rita');

    const args = buildFilterArgs([parent]).map(a => ({ ...a, parentIndex: a.parentIndex ?? null }));
    const rebuilt = buildStatementsFromFilterParams(args, [authorPred, namePred]);

    expect(rebuilt).toHaveLength(2);
    expect(rebuilt[1].parentId).toBe(rebuilt[0].id);
  });
});
