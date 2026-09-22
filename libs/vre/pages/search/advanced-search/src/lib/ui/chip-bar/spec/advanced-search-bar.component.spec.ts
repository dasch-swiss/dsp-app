import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Constants } from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { StatementElement } from '../../../model';
import { Operator } from '../../../operators.config';
import { DerivedSearchStateService } from '../../../service/derived-search-state.service';
import { OntologyDataService } from '../../../service/ontology-data.service';
import { SearchFlowLogger } from '../../../service/search-flow-logger.service';
import { SearchUrlParams, SearchUrlSyncService } from '../../../service/search-url-sync.service';
import { StatementDraftStore } from '../../../service/statement-draft.store';
import { makePredicate } from '../../../testing/test-data-builders';
import { OrderByComponent } from '../../order-by/order-by.component';
import { AddFilterButtonComponent } from '../add-filter-button.component';
import { AdvancedSearchBarComponent } from '../advanced-search-bar.component';
import { DataModelChipComponent } from '../data-model-chip.component';
import { FilterChipComponent } from '../filter-chip.component';
import { ResourceClassChipComponent } from '../resource-class-chip.component';

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
        { provide: OntologyDataService, useValue: ontologyDataServiceStub },
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

/**
 * `_writeFiltersToUrl` decides which chips get a `valueLabel` persisted alongside their IRI (DEV-6857).
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
  let writeState: jest.Mock;
  let store: FakeDraftStore;

  const setup = (statements: StatementElement[]): void => {
    store = new FakeDraftStore(statements);
    writeState = jest.fn();
    const urlSyncStub: Partial<SearchUrlSyncService> = {
      params$: of({}),
      writeState,
      readParams: jest.fn().mockReturnValue({}),
      encodeFilters: (filters): string => encodeURIComponent(JSON.stringify(filters)),
    };
    TestBed.configureTestingModule({
      imports: [AdvancedSearchBarComponent],
      providers: [
        { provide: SearchUrlSyncService, useValue: urlSyncStub },
        { provide: OntologyDataService, useValue: ontologyDataServiceStub },
        { provide: DerivedSearchStateService, useValue: { searchState$: of({ statements: [] }) } },
        { provide: SearchFlowLogger, useValue: { filterConfirmed: () => {} } },
        { provide: StatementDraftStore, useValue: store },
      ],
    });
    const fixture = TestBed.createComponent(AdvancedSearchBarComponent);
    component = fixture.componentInstance;
    component.projectUuid = 'test';
    store.statements$.subscribe(stmts =>
      component.confirmedStatements.set(stmts.filter(s => s.isValidAndComplete && !s.parentId))
    );
  };

  const decodeSingle = (encoded: string): Record<string, unknown> => JSON.parse(decodeURIComponent(encoded))[0];

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

    const [state] = writeState.mock.calls[0];
    const decoded = decodeSingle(state.filters);
    expect(decoded['value']).toBe(LIST_NODE_IRI);
    expect(decoded).not.toHaveProperty('valueLabel');
  });

  it('omits valueLabel for resource-class Matches chips (labels come from the ontology at render time)', () => {
    const stmt = makeResourceClassMatchesStatement();
    setup([stmt]);

    component.onFilterConfirmed(stmt.id);

    const [state] = writeState.mock.calls[0];
    const decoded = decodeSingle(state.filters);
    expect(decoded['value']).toBe(CLASS_IRI);
    expect(decoded).not.toHaveProperty('valueLabel');
  });

  it('persists valueLabel for link-value chips (no alternative label source for a resource IRI)', () => {
    const stmt = makeLinkValueStatement();
    setup([stmt]);

    component.onFilterConfirmed(stmt.id);

    const [state] = writeState.mock.calls[0];
    const decoded = decodeSingle(state.filters);
    expect(decoded['value']).toBe(LINK_IRI);
    expect(decoded['valueLabel']).toBe('Rita');
  });
});

describe('AdvancedSearchBarComponent fulltext term rules (DEV-6930)', () => {
  let fixture: ComponentFixture<AdvancedSearchBarComponent>;
  let component: AdvancedSearchBarComponent;
  let writeState: jest.Mock;

  const errorText = (): string | null =>
    (fixture.nativeElement as HTMLElement).querySelector('mat-error')?.textContent?.trim() ?? null;

  beforeEach(() => {
    jest.useFakeTimers();
    writeState = jest.fn();
    TestBed.configureTestingModule({
      imports: [AdvancedSearchBarComponent, TranslateModule.forRoot()],
      providers: [
        provideNoopAnimations(),
        {
          provide: SearchUrlSyncService,
          useValue: { params$: of({}), writeState, readParams: () => ({}), encodeFilters: () => '' },
        },
        { provide: OntologyDataService, useValue: ontologyDataServiceStub },
        { provide: DerivedSearchStateService, useValue: { searchState$: of({ statements: [] }) } },
        { provide: SearchFlowLogger, useValue: { fulltextChanged: () => {} } },
        { provide: StatementDraftStore, useValue: new FakeDraftStore([]) },
      ],
    });
    // Only the fulltext field is under test; the chip children need the whole ontology pipeline.
    TestBed.overrideComponent(AdvancedSearchBarComponent, {
      remove: {
        imports: [
          DataModelChipComponent,
          ResourceClassChipComponent,
          FilterChipComponent,
          AddFilterButtonComponent,
          OrderByComponent,
        ],
      },
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

    expect(writeState).not.toHaveBeenCalled();
  });

  it('shows the message without needing the field to be blurred first', () => {
    component.fulltextControl.setValue('de');
    jest.advanceTimersByTime(400);
    fixture.detectChanges();

    expect(errorText()).toBe('pages.search.termValidation.tooShort');
  });

  it('searches a three-character term', () => {
    component.fulltextControl.setValue('ide');
    jest.advanceTimersByTime(400);
    fixture.detectChanges();

    expect(writeState).toHaveBeenCalledWith({ q: 'ide' }, { replaceUrl: false });
    expect(errorText()).toBeNull();
  });
});
