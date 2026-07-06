import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
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
import { SearchUrlSyncService } from '../../service/search-url-sync.service';
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
          @for (child of childStatementsMap()[stmt.id] ?? []; track child.id) {
            <app-filter-chip
              class="chip--indented"
              [statement]="child"
              [isOpen]="openChipId() === child.id"
              [isValid]="child.isValidAndComplete"
              (openChange)="onChipOpenChange(child.id, $event)"
              (remove)="draftStore.deleteStatement(child)"
              (filterConfirm)="onConfirmNewFilter(child.id)"
              (filterCancel)="onCancelNewFilter(child)" />
          }
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
  readonly confirmedStatements = signal<StatementElement[]>([]);

  // The ephemeral editing tree — owned by StatementDraftStore. Child chips and auto-grow blanks
  // render from here; confirmed top-level chips come from the URL (searchState$).
  private readonly _statementElements = toSignal(this.draftStore.statements$, {
    initialValue: this.draftStore.currentStatements,
  });

  readonly childStatementsMap = signal<Record<string, StatementElement[]>>({});

  private _rebuildChildMap(): void {
    const result: Record<string, StatementElement[]> = {};
    for (const s of this._statementElements()) {
      if (s.parentId && !s.isPristine) {
        (result[s.parentId] ??= []).push(s);
      }
    }
    this.childStatementsMap.set(result);
  }

  readonly ontologyLoading$ = this._ontologyDataService.ontologyLoading$;

  ngOnInit(): void {
    this._ontologyDataService.init(`http://rdfh.ch/projects/${this.projectUuid}`);

    // Rebuild child map whenever the ephemeral editing tree changes.
    this.draftStore.statements$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(() => this._rebuildChildMap());

    // Seed the chip-bar UI from the URL-derived state: first load, back/forward, and any URL change
    // all flow through the single `searchState$` pipeline. The query itself is derived on the page;
    // here we only hydrate the *display* — the confirmed filter chips (top-level chips come straight
    // from the URL, in-progress rows live in StatementDraftStore).
    this._derivation.searchState$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(state => {
      this.confirmedStatements.set(state.statements.filter(s => s.isValidAndComplete));
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
    this._writeFiltersToUrl();
    // Explicit stale-orderBy cleanup: if the removed filter was the active sort,
    // clear `orderBy` from the URL — under the URL-derived model this is no longer emergent.
    if (stmt.selectedPredicate?.iri && stmt.selectedPredicate.iri === this._urlSync.readParams().orderBy) {
      this._urlSync.writeState({ orderBy: undefined }, { replaceUrl: false });
    }
  }

  private _writeFiltersToUrl(): void {
    const stmts = this.confirmedStatements();
    const idxById = new Map(stmts.map((s, i) => [s.id, i]));
    const filterArgs = stmts.map(stmt => ({
      predicateIri: stmt.selectedPredicate!.iri,
      operator: stmt.selectedOperator!,
      value: stmt.selectedObjectWriteValue ?? '',
      parentIndex: stmt.parentId !== undefined ? idxById.get(stmt.parentId) : undefined,
    }));
    const encoded = stmts.length ? this._urlSync.encodeFilters(filterArgs) : null;
    // `merge` handling preserves any existing orderBy param; orderBy is written by OrderByComponent.
    this._urlSync.writeState({ filters: encoded ?? undefined }, { replaceUrl: false });
  }
}
