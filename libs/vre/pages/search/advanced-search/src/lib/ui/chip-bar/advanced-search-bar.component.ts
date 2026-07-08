import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { StatementElement } from '../../model';
import { DerivedSearchStateService } from '../../service/derived-search-state.service';
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
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    OrderByComponent,
    ReactiveFormsModule,
    ResourceClassChipComponent,
  ],
  template: `
    @if (ontologyLoading$ | async) {
      <mat-progress-bar mode="query" />
    } @else {
      <mat-form-field appearance="outline" style="width: 600px" subscriptSizing="dynamic">
        <mat-label>Search in all text fields</mat-label>
        <input matInput type="text" [formControl]="fulltextControl" placeholder="Search in all text fields" />
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
            (filterCancel)="onCancelNewFilter(stmt)" />
        }

        <app-add-filter-button (filterConfirmed)="onFilterConfirmed($event)" />
        <app-order-by />
      </div>
    }
  `,
  styleUrl: './advanced-search-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchBarComponent implements OnInit {
  @Input({ required: true }) projectUuid!: string;

  private readonly _ontologyDataService = inject(OntologyDataService);
  private readonly _derivation = inject(DerivedSearchStateService);
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

  ngOnInit(): void {
    this._ontologyDataService.init(`http://rdfh.ch/projects/${this.projectUuid}`);

    // Seed the chip-bar UI from the URL-derived state: first load, back/forward, and any URL change
    // all flow through the single `searchState$` pipeline. The query itself is derived on the page;
    // here we only hydrate the *display* — the top-level confirmed filter chips. Subcriteria (child
    // statements) are edited inside the parent popover, so they are excluded from the chip row.
    this._derivation.searchState$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(state => {
      this.confirmedStatements.set(state.statements.filter(s => s.isValidAndComplete && !s.parentId));
    });

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

  onCancelNewFilter(stmt: StatementElement): void {
    this.draftStore.deleteStatement(stmt);
    this.openChipId.set(OPEN_CHIP_NONE);
  }

  onConfirmNewFilter(chipId: string): void {
    this._logger.filterConfirmed(chipId);
    this.openChipId.set(OPEN_CHIP_NONE);
    this._writeFiltersToUrl();
  }

  onFilterConfirmed(chipId: string): void {
    const stmt = this.draftStore.currentStatements.find(s => s.id === chipId);
    if (!stmt) return;
    this._logger.filterConfirmed(chipId);
    // Only the top-level statement becomes a chip; its subcriteria travel with it and are encoded into
    // the URL by _writeFiltersToUrl (which flattens each chip's subtree).
    this.confirmedStatements.update(stmts => [...stmts, stmt]);
    this._writeFiltersToUrl();
  }

  onResourceClassSelected(): void {
    // No-op beyond the class write (owned by resource-class-chip). The query re-derives from the URL.
  }

  onRemoveStatement(stmt: StatementElement): void {
    this._logger.filterRemoved(stmt.id);
    this.draftStore.deleteStatement(stmt);
    this.confirmedStatements.update(stmts => stmts.filter(s => s.id !== stmt.id));
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
    const filterArgs = stmts.map(stmt => ({
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
