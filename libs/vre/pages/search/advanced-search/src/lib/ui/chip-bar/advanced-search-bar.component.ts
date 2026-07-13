import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { StatementElement } from '../../model';
import { OntologyDataService } from '../../service/ontology-data.service';
import { SearchFlowLogger } from '../../service/search-flow-logger.service';
import { SearchUrlParams, SearchUrlSyncService } from '../../service/search-url-sync.service';
import { StatementDraftStore } from '../../service/statement-draft.store';
import { OrderByComponent } from '../order-by/order-by.component';
import { AddFilterButtonComponent } from './add-filter-button.component';
import { OPEN_CHIP_NONE, OpenChipId } from './chip-bar.helpers';
import { DataModelChipComponent } from './data-model-chip.component';
import { FilterChipComponent } from './filter-chip.component';
import { ResourceClassChipComponent } from './resource-class-chip.component';

@Component({
  selector: 'app-advanced-search-bar',
  standalone: true,
  imports: [
    AddFilterButtonComponent,
    AsyncPipe,
    DataModelChipComponent,
    FilterChipComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    OrderByComponent,
    ReactiveFormsModule,
    ResourceClassChipComponent,
    TranslateModule,
  ],
  template: `
    @if (ontologyLoading$ | async) {
      <mat-progress-bar mode="query" />
    } @else {
      <mat-form-field appearance="outline" style="margin-left: 8px; width: 600px" subscriptSizing="dynamic">
        <mat-label>{{ 'pages.search.advancedSearch.fulltextSearch' | translate }}</mat-label>
        <input
          matInput
          type="text"
          [formControl]="fulltextControl"
          [placeholder]="'pages.search.advancedSearch.fulltextSearch' | translate" />
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>
      <div class="chip-bar">
        <app-data-model-chip />
        <app-resource-class-chip (classSelected)="onResourceClassSelected()" />

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
        <app-order-by />

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

  private readonly _ontologyDataService = inject(OntologyDataService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _urlSync = inject(SearchUrlSyncService);
  private readonly _logger = inject(SearchFlowLogger);
  readonly draftStore = inject(StatementDraftStore);

  readonly openChipId = signal<OpenChipId>(OPEN_CHIP_NONE);
  readonly fulltextControl = new FormControl<string>('');
  // Top-level confirmed filters shown as chips. Subcriteria (child statements) are not shown as chips —
  // they are edited inside the parent's popover and travel with it when confirmed.
  readonly confirmedStatements = signal<StatementElement[]>([]);

  readonly ontologyLoading$ = this._ontologyDataService.ontologyLoading$;

  // Show the reset button only when there is something to clear. Any of the persisted search params
  // (fulltext, data model, resource class, filters, sort) counts as active state — reset wipes them all.
  readonly hasActiveState$ = this._urlSync.params$.pipe(
    map(p => !!(p.q || p.ontology || p.class || p.filters || p.orderBy)),
    distinctUntilChanged()
  );

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

    // Seed the fulltext input from the `q` param on any URL change, without echoing back into the URL
    // (`emitEvent: false`), so back/forward restores the field but does not re-push history.
    this._urlSync.params$
      .pipe(
        map(params => params.q ?? ''),
        distinctUntilChanged(),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(q => {
        if ((this.fulltextControl.value ?? '') !== q) {
          this.fulltextControl.setValue(q, { emitEvent: false });
        }
      });

    // Fulltext: after the user pauses typing (debounce), push one history entry so back/forward
    // steps through searched terms. The debounce coalesces a burst of keystrokes into a single entry.
    // The seed above uses `emitEvent: false`, so a back/forward navigation never re-pushes here.
    this.fulltextControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this._destroyRef))
      .subscribe(q => {
        this._logger.fulltextChanged(q ?? '');
        this._urlSync.writeState({ q: q ?? undefined }, { replaceUrl: false });
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
    this._writeFiltersToUrl();
  }

  onFilterConfirmed(chipId: string): void {
    const stmt = this.draftStore.currentStatements.find(s => s.id === chipId);
    if (!stmt) return;
    this._logger.filterConfirmed(chipId);
    // The statement is already valid and in the draft store, so it belongs in the chip row now. Refresh
    // the projection here (a signal write inside this click handler, so OnPush re-renders immediately —
    // the store's own emission during typing fired outside a render pass and left the chip hidden until
    // the next interaction). Subcriteria travel with the parent and are encoded by _writeFiltersToUrl.
    this._refreshChips();
    this._writeFiltersToUrl();
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
    // Full reset: clearAll nulls every search param in a single navigation. The store re-seeds from the
    // (now empty) URL and `_refreshChips` drops every chip; the fulltext input re-seeds from the empty `q`.
    this.openChipId.set(OPEN_CHIP_NONE);
    this._urlSync.clearAll();
  }

  onResourceClassSelected(): void {
    // No-op beyond the class write (owned by resource-class-chip). The query re-derives from the URL.
  }

  onRemoveStatement(stmt: StatementElement): void {
    this._logger.filterRemoved(stmt.id);
    // deleteStatement updates the store; `confirmedStatements` (a store projection) drops the chip.
    this.draftStore.deleteStatement(stmt);
    // Stale-orderBy cleanup: if the removed filter was the active sort, drop `orderBy` (and its direction)
    // too. This must go out in the SAME writeState as the filter change — two synchronous navigations get
    // coalesced by the Router, and the second would discard the first, so the filter removal would be lost.
    const clearsOrderBy =
      !!stmt.selectedPredicate?.iri && stmt.selectedPredicate.iri === this._urlSync.readParams().orderBy;
    this._writeFiltersToUrl(clearsOrderBy ? { orderBy: undefined, orderDir: undefined } : undefined);
  }

  private _writeFiltersToUrl(extra?: Partial<SearchUrlParams>): void {
    // Flatten each top-level chip's whole subtree, keeping every parent before its descendants so the
    // `parentIndex` back-references stay valid. Subcriteria are not chips but must be encoded here.
    const stmts = this.confirmedStatements().flatMap(stmt => [stmt, ...this.draftStore.descendantsOf(stmt)]);
    const idxById = new Map(stmts.map((s, i) => [s.id, i]));
    const filterArgs = stmts
      // Drop any statement whose parent is not in the flattened set (a phantom orphan) rather than
      // encoding `parentIndex: undefined`, which would decode as a spurious top-level filter. The flatten
      // above keeps every parent before its descendants, so a present parent always resolves here.
      .filter(stmt => stmt.parentId === undefined || idxById.has(stmt.parentId))
      .map(stmt => ({
        predicateIri: stmt.selectedPredicate!.iri,
        operator: stmt.selectedOperator!,
        value: stmt.selectedObjectWriteValue ?? '',
        // Persist the linked-resource label (e.g. "Rita") next to its IRI so the chip shows the name,
        // not the raw IRI, after a reload/back-forward. Undefined for plain string values.
        valueLabel: stmt.selectedObjectLabel,
        parentIndex: stmt.parentId !== undefined ? idxById.get(stmt.parentId) : undefined,
      }));
    const encoded = stmts.length ? this._urlSync.encodeFilters(filterArgs) : null;
    // `merge` handling preserves any param not named here (e.g. an unaffected orderBy, written by
    // OrderByComponent). `extra` folds any coupled change into this single navigation.
    this._urlSync.writeState({ filters: encoded ?? undefined, ...extra }, { replaceUrl: false });
  }
}
