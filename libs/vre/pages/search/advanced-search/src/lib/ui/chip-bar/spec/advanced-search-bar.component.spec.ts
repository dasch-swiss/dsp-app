import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
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

/**
 * Minimal stateful stand-in for StatementDraftStore: holds a flat statement tree and re-emits on
 * delete, mirroring the real store closely enough that `confirmedStatements` (a store projection) and
 * `_writeFiltersToUrl` behave as they do in the app. No auto-grow / seeding — the tests seed directly.
 */
class FakeDraftStore {
  private readonly _statements: BehaviorSubject<StatementElement[]>;
  readonly statements$;

  constructor(initial: StatementElement[]) {
    this._statements = new BehaviorSubject<StatementElement[]>(initial);
    this.statements$ = this._statements.asObservable();
  }

  get currentStatements(): StatementElement[] {
    return this._statements.value;
  }

  descendantsOf(parent: StatementElement): StatementElement[] {
    return this.currentStatements.filter(s => s.parentId === parent.id);
  }

  deleteStatement(statement: StatementElement): void {
    const toRemove = new Set([statement.id, ...this.descendantsOf(statement).map(s => s.id)]);
    this._statements.next(this.currentStatements.filter(s => !toRemove.has(s.id)));
  }
}

describe('AdvancedSearchBarComponent.onRemoveStatement (DEV-6576)', () => {
  let component: AdvancedSearchBarComponent;
  let writeState: jest.Mock;
  let readParams: jest.Mock<SearchUrlParams, []>;
  let store: FakeDraftStore;

  /** Wire the component to a fake store seeded with `statements`, then bootstrap it via ngOnInit. */
  const setup = (statements: StatementElement[]): void => {
    store = new FakeDraftStore(statements);
    TestBed.configureTestingModule({
      imports: [AdvancedSearchBarComponent],
      providers: [
        { provide: SearchUrlSyncService, useValue: urlSyncStub },
        { provide: OntologyDataService, useValue: { ontologyLoading$: of(false), init: () => {} } },
        { provide: DerivedSearchStateService, useValue: { searchState$: of({ statements: [] }) } },
        { provide: SearchFlowLogger, useValue: { filterRemoved: () => {} } },
        { provide: StatementDraftStore, useValue: store },
      ],
    });
    const fixture = TestBed.createComponent(AdvancedSearchBarComponent);
    component = fixture.componentInstance;
    component.projectUuid = 'test';
    // Subscribe confirmedStatements to the fake store (the real ngOnInit also inits ontology; we only
    // need the store→confirmedStatements wiring, so drive the projection directly to stay isolated).
    store.statements$.subscribe(stmts =>
      component.confirmedStatements.set(stmts.filter(s => s.isValidAndComplete && !s.parentId))
    );
  };

  let urlSyncStub: Partial<SearchUrlSyncService>;

  beforeEach(() => {
    writeState = jest.fn();
    readParams = jest.fn<SearchUrlParams, []>().mockReturnValue({});
    urlSyncStub = {
      params$: of({}),
      writeState,
      readParams,
      encodeFilters: (statements): string => encodeURIComponent(JSON.stringify(statements)),
    };
  });

  it('clears orderBy AND orderDir in a single writeState when the removed filter owns the active sort', () => {
    const stmt = makeConfirmedTitleStatement();
    setup([stmt]);
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
    setup([removed, kept]);
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
