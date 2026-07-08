import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { StatementElement } from '../../../model';
import { Operator } from '../../../operators.config';
import { DerivedSearchStateService } from '../../../service/derived-search-state.service';
import { OntologyDataService } from '../../../service/ontology-data.service';
import { SearchFlowLogger } from '../../../service/search-flow-logger.service';
import { SearchUrlParams, SearchUrlSyncService } from '../../../service/search-url-sync.service';
import { StatementDraftStore } from '../../../service/statement-draft.store';
import { makePredicate } from '../../../testing/test-data-builders';
import { AdvancedSearchBarComponent } from '../advanced-search-bar.component';

/**
 * Regression coverage for `onRemoveStatement` (DEV-6576). Removing a filter that is *also* the active
 * sort must clear `orderBy`/`orderDir` in the SAME `writeState` as the filter change — two synchronous
 * navigations get coalesced by the Router (the second discards the first), which previously dropped the
 * filter removal and left only the orderBy cleared.
 */
const ONTO = 'http://api.stage.dasch.swiss/ontology/0806/webern-onto/v2';
const TITLE_IRI = `${ONTO}#hasTitle`;

/** A confirmed, single-predicate text statement — enough for `onRemoveStatement` to read its IRI/value. */
function makeConfirmedTitleStatement(value = 'x'): StatementElement {
  const stmt = new StatementElement();
  stmt.selectedPredicate = makePredicate(
    TITLE_IRI,
    'Title',
    'http://api.knora.org/ontology/knora-api/v2#TextValue',
    false
  );
  stmt.selectedOperator = Operator.Equals;
  stmt.selectedObjectValue = value;
  return stmt;
}

describe('AdvancedSearchBarComponent.onRemoveStatement (DEV-6576)', () => {
  let component: AdvancedSearchBarComponent;
  let writeState: jest.Mock;
  let readParams: jest.Mock<SearchUrlParams, []>;

  beforeEach(() => {
    writeState = jest.fn();
    readParams = jest.fn<SearchUrlParams, []>().mockReturnValue({});

    const urlSyncStub: Partial<SearchUrlSyncService> = {
      params$: of({}),
      writeState,
      readParams,
      encodeFilters: (statements): string => encodeURIComponent(JSON.stringify(statements)),
    };

    TestBed.configureTestingModule({
      imports: [AdvancedSearchBarComponent],
      providers: [
        { provide: SearchUrlSyncService, useValue: urlSyncStub },
        { provide: OntologyDataService, useValue: { ontologyLoading$: of(false), init: () => {} } },
        { provide: DerivedSearchStateService, useValue: { searchState$: of({ statements: [] }) } },
        { provide: SearchFlowLogger, useValue: { filterRemoved: () => {} } },
        {
          provide: StatementDraftStore,
          useValue: {
            statements$: of([]),
            currentStatements: [],
            deleteStatement: () => {},
            descendantsOf: () => [],
          },
        },
      ],
    });

    // Construct the component without running ngOnInit — we drive `confirmedStatements` directly and
    // exercise `onRemoveStatement` in isolation, avoiding the ontology/URL bootstrap side effects.
    component = TestBed.createComponent(AdvancedSearchBarComponent).componentInstance;
  });

  it('clears orderBy AND orderDir in a single writeState when the removed filter owns the active sort', () => {
    const stmt = makeConfirmedTitleStatement();
    component.confirmedStatements.set([stmt]);
    readParams.mockReturnValue({ orderBy: TITLE_IRI, orderDir: 'desc' });

    component.onRemoveStatement(stmt);

    // One navigation only — the filter removal and the orderBy cleanup must be folded together, or the
    // Router coalesces them and the filter change is lost (the original bug).
    expect(writeState).toHaveBeenCalledTimes(1);
    const [state, opts] = writeState.mock.calls[0];
    // The only confirmed statement was removed, so `filters` is dropped (undefined).
    expect(state).toEqual({ filters: undefined, orderBy: undefined, orderDir: undefined });
    expect(opts).toEqual({ replaceUrl: false });
  });

  it('leaves orderBy untouched when the removed filter is not the active sort', () => {
    const removed = makeConfirmedTitleStatement('gone');
    const kept = makeConfirmedTitleStatement('stays');
    component.confirmedStatements.set([removed, kept]);
    // Active sort points at a different predicate, so removing `removed` must not touch orderBy.
    readParams.mockReturnValue({ orderBy: `${ONTO}#hasAuthor` });

    component.onRemoveStatement(removed);

    expect(writeState).toHaveBeenCalledTimes(1);
    const [state] = writeState.mock.calls[0];
    // `orderBy`/`orderDir` are absent from the write, so `merge` preserves the existing param.
    expect(state).not.toHaveProperty('orderBy');
    expect(state).not.toHaveProperty('orderDir');
    // The surviving filter is still encoded.
    expect(typeof state.filters).toBe('string');
    expect(decodeURIComponent(state.filters)).toContain('stays');
    expect(decodeURIComponent(state.filters)).not.toContain('gone');
  });
});
