import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostBinding,
  inject,
  Input,
  OnInit,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { searchTermCompleteSyntaxValidator, searchTermMinLengthValidator } from '@dasch-swiss/vre/shared/app-common';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, first, map } from 'rxjs';
import { FilterParam } from '../../filter-params.codec';
import { PropertyObjectType, StatementElement } from '../../model';
import { SearchFilterState } from '../../search-filter-state';
import { FilterEditorRequestService } from '../../service/filter-editor-request.service';
import { OntologyDataService } from '../../service/ontology-data.service';
import { SearchFlowLogger } from '../../service/search-flow-logger.service';
import { StatementDraftStore } from '../../service/statement-draft.store';
import { AddFilterButtonComponent } from './add-filter-button.component';
import { OPEN_CHIP_NONE, OpenChipId } from './chip-bar.helpers';
import { FilterChipComponent } from './filter-chip.component';

/** The inline message for each way the fulltext term can be refused, in the order they are checked. */
const FULLTEXT_ERROR_MESSAGES: Record<
  'searchTermTooShort' | 'searchTermUnclosedPhrase' | 'searchTermTrailingEscape',
  string
> = {
  searchTermTooShort: 'pages.search.termValidation.tooShort',
  searchTermUnclosedPhrase: 'pages.search.termValidation.unclosedPhrase',
  searchTermTrailingEscape: 'pages.search.termValidation.trailingEscape',
};

@Component({
  selector: 'app-advanced-search-bar',
  standalone: true,
  imports: [
    AddFilterButtonComponent,
    AsyncPipe,
    FilterChipComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  template: `
    @if (ontologyLoading$ | async) {
      <mat-progress-bar mode="query" />
    } @else if (hasNoDataModel$ | async) {
      <div class="no-data-model">
        <mat-icon>info_outline</mat-icon>
        <span>{{ 'pages.search.advancedSearch.noDataModel' | translate }}</span>
      </div>
    } @else {
      <mat-form-field appearance="outline" subscriptSizing="dynamic" [style.width]="searchFieldWidth">
        @if (showSearchLabel) {
          <mat-label>{{ searchLabelKey | translate }}</mat-label>
        }
        @if (searchIconPosition === 'leading') {
          <mat-icon matPrefix>search</mat-icon>
        }
        <input
          matInput
          type="text"
          [formControl]="fulltextControl"
          [placeholder]="searchPlaceholderKey | translate"
          [attr.aria-label]="showSearchLabel ? null : (searchLabelKey | translate)" />
        @if (fulltextControl.value) {
          <button
            mat-icon-button
            matSuffix
            type="button"
            data-cy="clear-search-btn"
            [attr.aria-label]="'pages.search.advancedSearch.clearSearch' | translate"
            (click)="onClearFulltext()">
            <mat-icon>close</mat-icon>
          </button>
        } @else if (searchIconPosition === 'trailing') {
          <mat-icon matSuffix>search</mat-icon>
        }
        @if (fulltextError(); as message) {
          <mat-error>{{ message | translate }}</mat-error>
        }
      </mat-form-field>
      <div class="chip-bar">
        <!-- Chips that write params this page owns — the data model and resource class on the Search
             tab, nothing on the Data tab, where the sidenav route already fixes both. -->
        <ng-content select="[searchFiltersLeading]" />

        @for (stmt of confirmedStatements(); track stmt.id) {
          <app-filter-chip
            [statement]="stmt"
            [isOpen]="openChipId() === stmt.id"
            [isValid]="stmt.isValidAndComplete"
            (openChange)="onChipOpenChange(stmt.id, $event)"
            (remove)="onRemoveStatement(stmt)"
            (filterConfirm)="onConfirmNewFilter(stmt.id)"
            (filterCancel)="onCancelEdit()" />
        }

        <app-add-filter-button (filterConfirmed)="onFilterConfirmed($event)" />
        <!-- Sorting is page-specific: the Search tab sorts by a filter's predicate, the Data tab by
             label from its own column header. -->
        <ng-content select="[searchFiltersTrailing]" />

        @if (hasActiveState$ | async) {
          <button mat-button color="primary" type="button" (click)="onReset()">
            <mat-icon>restart_alt</mat-icon>
            {{ 'pages.search.advancedSearch.reset' | translate }}
          </button>
        }
      </div>
    }
  `,
  styleUrl: './advanced-search-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchBarComponent implements OnInit {
  @Input({ required: true }) projectUuid!: string;

  /**
   * `compact` is the Data tab's treatment: 30px controls and 13px text, so the bar fits a narrow split
   * column without crowding out the class identity. Styling only — behaviour is identical.
   */
  @Input() density: 'standard' | 'compact' = 'standard';

  /** The Search tab gives the field the page width it has; the Data tab has a split column to fit. */
  @Input() searchFieldWidth = '600px';

  @Input() searchLabelKey = 'pages.search.advancedSearch.fulltextSearch';
  @Input() searchPlaceholderKey = 'pages.search.advancedSearch.fulltextSearchPlaceholder';

  /**
   * Where the magnifier sits. `trailing` is the Search tab's long-standing look, where the icon only
   * shows while the field is empty and gives way to the clear button. `leading` is the Data tab's
   * design of record: the icon is a persistent affordance on the left and the clear button owns the
   * right, so both can be visible at once.
   */
  @Input() searchIconPosition: 'leading' | 'trailing' = 'trailing';

  /**
   * Whether to float a label above the field. The Data tab's design has none — the placeholder and
   * the magnifier carry the meaning — so it renders without one and the label key becomes the
   * input's `aria-label` instead, keeping the field named for assistive technology either way.
   */
  @Input() showSearchLabel = true;

  @HostBinding('class.compact') get isCompact(): boolean {
    return this.density === 'compact';
  }

  private readonly _ontologyDataService = inject(OntologyDataService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _state = inject(SearchFilterState);
  private readonly _logger = inject(SearchFlowLogger);
  private readonly _filterEditorRequests = inject(FilterEditorRequestService);
  readonly draftStore = inject(StatementDraftStore);

  /**
   * The rendered chips and the add button, so a request arriving from outside the bar can drive the
   * same popovers a click on them would. Queried rather than reimplemented: both components own an
   * editing draft whose lifecycle (clone, commit, discard) is the hard part, and a second way of
   * opening the editor would be a second place for it to leak.
   */
  private readonly _chips = viewChildren(FilterChipComponent);
  private readonly _addFilterButton = viewChild(AddFilterButtonComponent);

  readonly openChipId = signal<OpenChipId>(OPEN_CHIP_NONE);
  // Only the min-length half of the term rules: this term travels through Gravsearch `matchFulltext`,
  // which — unlike `/v2/search/:term` — accepts a wildcard on a short stem ("de*" returns 200), so the
  // per-token wildcard rule would block searches the API is happy to run (DEV-6930). The syntax rule
  // holds back a phrase whose closing quote is not typed yet, which Lucene cannot parse (DEV-7370).
  readonly fulltextControl = new FormControl<string>('', [
    searchTermMinLengthValidator(),
    searchTermCompleteSyntaxValidator(),
  ]);
  // Translation key of the inline message, raised at the debounce, i.e. the moment the term would have
  // been searched — validating on every keystroke instead would flag "de" on the way to "deutsch".
  readonly fulltextError = signal<string | null>(null);
  // Top-level confirmed filters shown as chips. Subcriteria (child statements) are not shown as chips —
  // they are edited inside the parent's popover and travel with it when confirmed.
  readonly confirmedStatements = signal<StatementElement[]>([]);

  readonly ontologyLoading$ = this._ontologyDataService.ontologyLoading$;

  readonly hasNoDataModel$ = this._ontologyDataService.ontologies$.pipe(map(ontologies => ontologies.length === 0));

  // Show the reset button only when there is something to clear. What counts as "something" is the
  // host page's call — the Search tab counts its five params, the Data tab also counts its sort.
  readonly hasActiveState$ = this._state.hasActiveState$;

  ngOnInit(): void {
    this._ontologyDataService.init(`http://rdfh.ch/projects/${this.projectUuid}`);

    // Seed the chip-bar UI from the *draft store* tree, NOT directly from `searchState$`. The store is
    // itself re-seeded from `searchState$` (URL is source of truth), but reconstruction mints fresh
    // StatementElement instances on every emission. Binding the chips to the store guarantees the chip
    // parent and its child statements are the *same* instances, so `childrenOf(parent)` in the popover
    // resolves — otherwise the chip could hold a parent from one emission while the store's children
    // point at a parent from a later emission (different id), and subcriteria would vanish on re-open.
    // Top-level, valid statements only: subcriteria are edited inside the parent popover, not as chips.
    this.draftStore.statements$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(() => this._refreshChips());

    // Something outside the bar (a Data tab column header) naming a property to filter on.
    this._filterEditorRequests.requests$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(predicateIri => this.openEditorFor(predicateIri));

    // Seed the fulltext input from the host's stored term on any change, without echoing back into it
    // (`emitEvent: false`), so back/forward restores the field but does not re-push history.
    this._state.fulltextTerm$.pipe(distinctUntilChanged(), takeUntilDestroyed(this._destroyRef)).subscribe(q => {
      if ((this.fulltextControl.value ?? '') !== q) {
        this.fulltextControl.setValue(q, { emitEvent: false });
      }
      // A deep link can carry a term the input would have refused. The query still runs (the URL is
      // the source of truth, and its failure is DEV-6866's panel), but the field says what is wrong.
      this._refreshFulltextError();
    });

    // Fulltext: after the user pauses typing (debounce), push one history entry so back/forward
    // steps through searched terms. The debounce coalesces a burst of keystrokes into a single entry.
    // The seed above uses `emitEvent: false`, so a back/forward navigation never re-pushes here.
    // A term dsp-api would reject outright is not written at all: the field shows the inline message
    // and the URL (and therefore the query) stays on the last term that searched.
    this.fulltextControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this._destroyRef))
      .subscribe(q => {
        this._refreshFulltextError();
        if (this.fulltextControl.invalid) {
          return;
        }
        this._state.setFulltextTerm(q ?? undefined);
      });
  }

  /**
   * Raise or clear the inline message for the current term.
   *
   * `markAsTouched` is what actually makes the `mat-error` render, and it is not optional: Material
   * gates the subscript on the control's error state, which for a control with no parent form is
   * `invalid && touched` — and `touched` is otherwise set only by the value accessor's blur handler.
   * Without it a term typed and never blurred is dropped in silence, which is worse than the 400 this
   * whole change exists to avoid.
   */
  private _refreshFulltextError(): void {
    const errors = this.fulltextControl.errors ?? {};
    const errorKey = (Object.keys(FULLTEXT_ERROR_MESSAGES) as (keyof typeof FULLTEXT_ERROR_MESSAGES)[]).find(
      key => key in errors
    );
    this.fulltextError.set(errorKey ? FULLTEXT_ERROR_MESSAGES[errorKey] : null);
    if (this.fulltextControl.invalid) {
      this.fulltextControl.markAsTouched();
    }
  }

  /**
   * Clear the term immediately rather than waiting out the debounce: the click IS the intent, and an
   * empty value is valid, so routing it through `valueChanges` would both delay the re-query by 300ms
   * and leave a stale too-short error on screen in the meantime.
   */
  onClearFulltext(): void {
    this.fulltextControl.setValue('', { emitEvent: false });
    this._refreshFulltextError();
    this._state.setFulltextTerm(undefined);
  }

  /**
   * Open the filter editor on one property, wherever the request came from.
   *
   * An existing chip on that property is re-opened rather than joined by a second one (PRD REQ-3.7).
   * That is not merely tidier: two chips on the same predicate produce two `FILTER` clauses ANDed
   * together in Gravsearch, so a user who filtered twice from the same column header would silently
   * narrow their results to the intersection and have no single chip to undo it with.
   *
   * The predicate is resolved through the ontology rather than passed in, because a caller outside
   * this lib has a property IRI and no `Predicate` — and `StatementElement` needs the whole thing
   * (object value type, link-ness, list root) to decide which operators and which value editor to
   * offer.
   */
  openEditorFor(predicateIri: string): void {
    const existing = this.confirmedStatements().find(stmt => stmt.selectedPredicate?.iri === predicateIri);
    if (existing) {
      this._chips()
        .find(chip => chip.statement.id === existing.id)
        ?.onOpen();
      return;
    }

    this._ontologyDataService
      .getProperties$()
      .pipe(first(), takeUntilDestroyed(this._destroyRef))
      .subscribe(predicates => {
        const predicate = predicates.find(p => p.iri === predicateIri);
        // Silently ignored when the ontology does not offer the property as a filterable predicate:
        // the request came from a column the bar cannot express, and opening a blank editor would
        // be a worse answer than doing nothing.
        if (predicate) {
          this._addFilterButton()?.openFor(predicate);
        }
      });
  }

  onChipOpenChange(chipId: string, isOpen: boolean): void {
    this.openChipId.set(isOpen ? chipId : OPEN_CHIP_NONE);
  }

  onCancelEdit(): void {
    // The chip discarded its own editing clone; the original statement (and its chip) is untouched.
    // Nothing to persist — just close the popover.
    this.openChipId.set(OPEN_CHIP_NONE);
  }

  onConfirmNewFilter(chipId: string): void {
    // An edited confirmed chip was committed (the chip promoted its clone over the original). Re-project
    // and persist the now-current confirmed set to the URL.
    this._logger.filterConfirmed(chipId);
    this.openChipId.set(OPEN_CHIP_NONE);
    this._refreshChips();
    this._persistFilters();
  }

  onFilterConfirmed(chipId: string): void {
    const stmt = this.draftStore.currentStatements.find(s => s.id === chipId);
    if (!stmt) return;
    this._logger.filterConfirmed(chipId);
    // The statement is already valid and in the draft store, so it belongs in the chip row now. Refresh
    // the projection here (a signal write inside this click handler, so OnPush re-renders immediately —
    // the store's own emission during typing fired outside a render pass and left the chip hidden until
    // the next interaction). Subcriteria travel with the parent and are encoded by _persistFilters.
    this._refreshChips();
    this._persistFilters();
  }

  /**
   * Re-project the top-level, valid, *non-editing* statements from the draft store into the chip signal.
   * Editing clones (a confirmed filter being edited in isolation in its popover) are excluded so the
   * displayed chip does not change while its popover is open.
   */
  private _refreshChips(): void {
    this.confirmedStatements.set(
      this.draftStore.currentStatements.filter(
        s => s.isValidAndComplete && !s.parentId && !this.draftStore.isEditing(s)
      )
    );
  }

  onReset(): void {
    // Full reset: the host clears everything it considers search state in a single navigation. The store
    // re-seeds from the (now empty) state and `_refreshChips` drops every chip; the fulltext input
    // re-seeds from the empty term.
    this.openChipId.set(OPEN_CHIP_NONE);
    // Drafts are not part of the host's stored state, so a reset with nothing else set would not
    // re-seed the store and a half-built filter would survive the click. Discard them explicitly.
    this.draftStore.discardDrafts();
    this._state.reset();
  }

  onRemoveStatement(stmt: StatementElement): void {
    this._logger.filterRemoved(stmt.id);
    // deleteStatement updates the store; `confirmedStatements` (a store projection) drops the chip.
    this.draftStore.deleteStatement(stmt);
    // Hand the removed filter's predicate to the host: a page that sorts by a filter's predicate needs to
    // drop a now-orphaned sort, and must do it in the same navigation as the filter change. Whether that
    // applies is the host's business, not the bar's.
    this._persistFilters(stmt.selectedPredicate?.iri);
  }

  private _persistFilters(removedPredicateIri?: string): void {
    // Flatten each top-level chip's whole subtree, keeping every parent before its descendants so the
    // `parentIndex` back-references stay valid. Subcriteria are not chips but must be encoded here.
    const stmts = this.confirmedStatements().flatMap(stmt => [stmt, ...this.draftStore.descendantsOf(stmt)]);
    const idxById = new Map(stmts.map((s, i) => [s.id, i]));
    const filterArgs: FilterParam[] = stmts
      // Drop any statement whose parent is not in the flattened set (a phantom orphan) rather than
      // encoding `parentIndex: undefined`, which would decode as a spurious top-level filter. The flatten
      // above keeps every parent before its descendants, so a present parent always resolves here.
      .filter(stmt => stmt.parentId === undefined || idxById.has(stmt.parentId))
      .map(stmt => ({
        predicateIri: stmt.selectedPredicate!.iri,
        operator: stmt.selectedOperator!,
        value: stmt.selectedObjectWriteValue ?? '',
        // Persist the label only for link values, where the label ("Rita" for an author IRI) has no
        // multi-language source the app already fetches — without this, the chip would render the raw
        // IRI after a reload/back-forward. Lists and resource classes have their multi-language labels
        // in data the chip pipe already resolves (list tree / ontology), so persisting a single-language
        // string here would fossilize the label in the writer's language (DEV-6857). Plain string values
        // carry no label (the value IS the label).
        valueLabel: stmt.objectType === PropertyObjectType.LinkValueObject ? stmt.selectedObjectLabel : undefined,
        parentIndex: stmt.parentId !== undefined ? (idxById.get(stmt.parentId) ?? null) : null,
      }));
    this._state.setFilters(filterArgs, removedPredicateIri);
  }
}
