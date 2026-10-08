import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Constants } from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { FilterParam } from '../../../filter-params.codec';
import { StatementElement } from '../../../model';
import { Operator } from '../../../operators.config';
import { SearchFilterState } from '../../../search-filter-state';
import { FilterEditorRequestService } from '../../../service/filter-editor-request.service';
import { OntologyDataService } from '../../../service/ontology-data.service';
import { SearchFlowLogger } from '../../../service/search-flow-logger.service';
import { StatementDraftStore } from '../../../service/statement-draft.store';
import { makePredicate } from '../../../testing/test-data-builders';
import { AddFilterButtonComponent } from '../add-filter-button.component';
import { AdvancedSearchBarComponent } from '../advanced-search-bar.component';
import { FilterChipComponent } from '../filter-chip.component';

/**
 * A `SearchFilterState` whose mutators are spies. The bar is host-agnostic now, so these specs assert
 * what it *hands the host*, not what lands in a URL — the encoding and any coupled param cleanup belong
 * to the host's own implementation and are covered in its spec.
 */
function makeStatePort(overrides: Partial<SearchFilterState> = {}) {
  return {
    filters$: of([] as FilterParam[]),
    fulltextTerm$: of(''),
    ontologyIri$: of(undefined),
    resourceClassIri$: of(undefined),
    hasActiveState$: of(false),
    setFulltextTerm: jest.fn(),
    setFilters: jest.fn(),
    reset: jest.fn(),
    ...overrides,
  };
}

/**
 * Regression coverage for `onRemoveStatement` (DEV-6576). The bar's half of the contract is to report the
 * removed filter's predicate alongside the surviving filters, in ONE call, so a host that sorts by that
 * predicate can clear its sort in the same navigation — two synchronous navigations get coalesced by the
 * Router (the second discards the first), which previously dropped the filter removal. The clearing
 * itself now lives in `SearchUrlSyncService.setFilters` and is covered by its spec.
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
 * `_persistFilters` behave as they do in the app. No auto-grow / seeding — the tests seed directly.
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

  // `_refreshChips` filters editing clones out of the chip row. The fake never mints editing clones,
  // so isEditing is a constant false — enough to make the projection work in-test.
  isEditing(): boolean {
    return false;
  }
}

/**
 * The component reads several OntologyDataService streams at field-initialisation time, so every
 * one it touches must exist on the stub or construction throws before any test runs. `ontologies$`
 * drives the "project has no data model" empty state (DEV-6738); these specs exercise the loaded
 * case, so it emits a non-empty list.
 */
const ontologyDataServiceStub = {
  ontologyLoading$: of(false),
  ontologies$: of([{ iri: ONTO, labels: [{ value: 'Webern', language: 'en' }] }]),
  init: () => {},
};

describe('AdvancedSearchBarComponent.onRemoveStatement (DEV-6576)', () => {
  let component: AdvancedSearchBarComponent;
  let statePort: ReturnType<typeof makeStatePort>;
  let store: FakeDraftStore;

  /** Wire the component to a fake store seeded with `statements`, then bootstrap it via ngOnInit. */
  const setup = (statements: StatementElement[]): void => {
    store = new FakeDraftStore(statements);
    TestBed.configureTestingModule({
      imports: [AdvancedSearchBarComponent],
      providers: [
        { provide: SearchFilterState, useValue: statePort },
        { provide: OntologyDataService, useValue: ontologyDataServiceStub },
        { provide: SearchFlowLogger, useValue: { filterRemoved: () => {} } },
        { provide: StatementDraftStore, useValue: store },
        FilterEditorRequestService,
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

  beforeEach(() => {
    statePort = makeStatePort();
  });

  it('reports the removed predicate with the surviving filters in a single call', () => {
    const stmt = makeConfirmedTitleStatement();
    setup([stmt]);

    component.onRemoveStatement(stmt);

    // One call only — the filter set and the predicate that was removed must reach the host together, or
    // a host that folds a sort cleanup into the same navigation cannot do so (the original bug).
    expect(statePort.setFilters).toHaveBeenCalledTimes(1);
    const [filters, removedPredicateIri] = statePort.setFilters.mock.calls[0];
    // The only confirmed statement was removed, so nothing survives.
    expect(filters).toEqual([]);
    expect(removedPredicateIri).toBe(TITLE_IRI);
  });

  it('still reports the surviving filters when one of several is removed', () => {
    const removed = makeConfirmedTitleStatement('gone');
    const kept = makeConfirmedTitleStatement('stays');
    setup([removed, kept]);

    component.onRemoveStatement(removed);

    expect(statePort.setFilters).toHaveBeenCalledTimes(1);
    const [filters, removedPredicateIri] = statePort.setFilters.mock.calls[0];
    expect(filters).toHaveLength(1);
    expect(filters[0].value).toBe('stays');
    expect(removedPredicateIri).toBe(TITLE_IRI);
  });
});

/**
 * `_persistFilters` decides which chips get a `valueLabel` persisted alongside their IRI (DEV-6857).
 * A rendered label in the URL fossilises the language it was written in — the chip then can't retranslate
 * on language switch. We only accept that trade-off for link values, whose label ("Rita" for an author
 * IRI) is not derivable from anything the search page already fetches. For list values and resource-class
 * `Matches`, the multi-language labels live in the loaded list tree / ontology, so we omit `valueLabel`
 * and let `ChipLabelPipe` re-resolve at render time.
 */
describe('AdvancedSearchBarComponent — valueLabel URL persistence (DEV-6857)', () => {
  const ONTO_ROOT = 'http://api.stage.dasch.swiss/ontology/0806/test-onto/v2';
  const LIST_ROOT_IRI = `${ONTO_ROOT}/lists/root`;
  const LIST_NODE_IRI = `${LIST_ROOT_IRI}/node/1`;
  const CLASS_IRI = `${ONTO_ROOT}#Person`;
  const AUTHOR_IRI = `${ONTO_ROOT}#hasAuthor`;
  const LINK_IRI = 'http://rdfh.ch/0801/abc';

  let component: AdvancedSearchBarComponent;
  let statePort: ReturnType<typeof makeStatePort>;
  let store: FakeDraftStore;

  const setup = (statements: StatementElement[]): void => {
    store = new FakeDraftStore(statements);
    statePort = makeStatePort();
    TestBed.configureTestingModule({
      imports: [AdvancedSearchBarComponent],
      providers: [
        { provide: SearchFilterState, useValue: statePort },
        { provide: OntologyDataService, useValue: ontologyDataServiceStub },
        { provide: SearchFlowLogger, useValue: { filterConfirmed: () => {} } },
        { provide: StatementDraftStore, useValue: store },
        FilterEditorRequestService,
      ],
    });
    const fixture = TestBed.createComponent(AdvancedSearchBarComponent);
    component = fixture.componentInstance;
    component.projectUuid = 'test';
    store.statements$.subscribe(stmts =>
      component.confirmedStatements.set(stmts.filter(s => s.isValidAndComplete && !s.parentId))
    );
  };

  /** The single filter the bar handed the host on the last `setFilters` call. */
  const persistedSingle = (): Record<string, unknown> =>
    statePort.setFilters.mock.calls[0][0][0] as Record<string, unknown>;

  const makeListValueStatement = (): StatementElement => {
    const stmt = new StatementElement();
    stmt.selectedPredicate = makePredicate(`${ONTO_ROOT}#hasField`, 'Field', Constants.ListValue, false, LIST_ROOT_IRI);
    stmt.selectedOperator = Operator.Equals;
    stmt.selectedObjectValue = {
      iri: LIST_NODE_IRI,
      labels: [{ language: 'en', value: 'Professional exam' }],
      comments: [],
    };
    return stmt;
  };

  const makeResourceClassMatchesStatement = (): StatementElement => {
    const stmt = new StatementElement();
    // `Matches` on a link property → the model classifies the objectType as `ResourceObject`, but
    // only when `predicate.objectValueType` does NOT include the KnoraApiV2 prefix (see PropertyObjectType
    // branching in model.ts). In real ontology hydration, that field carries the *target class IRI*
    // (e.g. the "Person" class), so mirror that here.
    stmt.selectedPredicate = makePredicate(AUTHOR_IRI, 'author', CLASS_IRI, true);
    stmt.selectedOperator = Operator.Matches;
    stmt.selectedObjectValue = {
      iri: CLASS_IRI,
      labels: [{ language: 'en', value: 'Person' }],
      comments: [],
    };
    return stmt;
  };

  const makeLinkValueStatement = (): StatementElement => {
    const stmt = new StatementElement();
    // A link-property Equals (or NotEquals) → objectType `LinkValueObject`; here the predicate's
    // `objectValueType` still names the target class, but the operator (Equals) — not the type — is what
    // routes us to the LinkValueObject branch, which is where we DO persist `valueLabel`.
    stmt.selectedPredicate = makePredicate(AUTHOR_IRI, 'author', CLASS_IRI, true);
    stmt.selectedOperator = Operator.Equals;
    stmt.selectedObjectValue = {
      iri: LINK_IRI,
      labels: [{ language: 'en', value: 'Rita' }],
      comments: [],
    };
    return stmt;
  };

  it('omits valueLabel for list-value chips (labels come from the list tree at render time)', () => {
    const stmt = makeListValueStatement();
    setup([stmt]);

    component.onFilterConfirmed(stmt.id);

    const decoded = persistedSingle();
    expect(decoded['value']).toBe(LIST_NODE_IRI);
    expect(decoded['valueLabel']).toBeUndefined();
  });

  it('omits valueLabel for resource-class Matches chips (labels come from the ontology at render time)', () => {
    const stmt = makeResourceClassMatchesStatement();
    setup([stmt]);

    component.onFilterConfirmed(stmt.id);

    const decoded = persistedSingle();
    expect(decoded['value']).toBe(CLASS_IRI);
    expect(decoded['valueLabel']).toBeUndefined();
  });

  it('persists valueLabel for link-value chips (no alternative label source for a resource IRI)', () => {
    const stmt = makeLinkValueStatement();
    setup([stmt]);

    component.onFilterConfirmed(stmt.id);

    const decoded = persistedSingle();
    expect(decoded['value']).toBe(LINK_IRI);
    expect(decoded['valueLabel']).toBe('Rita');
  });
});

describe('AdvancedSearchBarComponent fulltext term rules (DEV-6930)', () => {
  let fixture: ComponentFixture<AdvancedSearchBarComponent>;
  let component: AdvancedSearchBarComponent;
  let statePort: ReturnType<typeof makeStatePort>;

  const errorText = (): string | null =>
    (fixture.nativeElement as HTMLElement).querySelector('mat-error')?.textContent?.trim() ?? null;

  beforeEach(() => {
    jest.useFakeTimers();
    statePort = makeStatePort();
    TestBed.configureTestingModule({
      imports: [AdvancedSearchBarComponent, TranslateModule.forRoot()],
      providers: [
        provideNoopAnimations(),
        { provide: SearchFilterState, useValue: statePort },
        { provide: OntologyDataService, useValue: ontologyDataServiceStub },
        { provide: SearchFlowLogger, useValue: { fulltextChanged: () => {} } },
        { provide: StatementDraftStore, useValue: new FakeDraftStore([]) },
        FilterEditorRequestService,
      ],
    });
    // Only the fulltext field is under test; the chip children need the whole ontology pipeline. The
    // page-specific chips are projected content now, so there is nothing of theirs to remove here.
    TestBed.overrideComponent(AdvancedSearchBarComponent, {
      remove: { imports: [FilterChipComponent, AddFilterButtonComponent] },
      add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    fixture = TestBed.createComponent(AdvancedSearchBarComponent);
    component = fixture.componentInstance;
    component.projectUuid = 'test';
    fixture.detectChanges();
  });

  afterEach(() => jest.useRealTimers());

  it('does not search a two-character term', () => {
    component.fulltextControl.setValue('de');
    jest.advanceTimersByTime(400);
    fixture.detectChanges();

    expect(statePort.setFulltextTerm).not.toHaveBeenCalled();
  });

  it('shows the message without needing the field to be blurred first', () => {
    component.fulltextControl.setValue('de');
    jest.advanceTimersByTime(400);
    fixture.detectChanges();

    expect(errorText()).toBe('pages.search.termValidation.tooShort');
  });

  it('does not search a phrase whose closing quote is not typed yet (DEV-7370)', () => {
    component.fulltextControl.setValue('"rod of asclepious');
    jest.advanceTimersByTime(400);
    fixture.detectChanges();

    expect(statePort.setFulltextTerm).not.toHaveBeenCalled();
    expect(errorText()).toBe('pages.search.termValidation.unclosedPhrase');
  });

  it('searches the phrase once it is closed', () => {
    component.fulltextControl.setValue('"rod of asclepious"');
    jest.advanceTimersByTime(400);
    fixture.detectChanges();

    expect(statePort.setFulltextTerm).toHaveBeenCalledWith('"rod of asclepious"');
    expect(errorText()).toBeNull();
  });

  it('searches a term whose quotes are escaped', () => {
    component.fulltextControl.setValue('\\"rod of asclepious');
    jest.advanceTimersByTime(400);

    expect(statePort.setFulltextTerm).toHaveBeenCalledWith('\\"rod of asclepious');
  });

  it('searches a three-character term', () => {
    component.fulltextControl.setValue('ide');
    jest.advanceTimersByTime(400);
    fixture.detectChanges();

    expect(statePort.setFulltextTerm).toHaveBeenCalledWith('ide');
    expect(errorText()).toBeNull();
  });
});
