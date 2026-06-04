import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { debounceTime, distinctUntilChanged, filter, of, switchMap, take } from 'rxjs';
import { NodeValue, StatementElement } from '../../model';
import { GravsearchService } from '../../service/gravsearch.service';
import { OntologyDataService } from '../../service/ontology-data.service';
import { PropertyFormManager } from '../../service/property-form.manager';
import { SearchStateService } from '../../service/search-state.service';
import { SearchUrlSyncService, SearchUrlParams } from '../../service/search-url-sync.service';
import { OrderByComponent } from '../order-by/order-by.component';
import { AddFilterButtonComponent } from './add-filter-button.component';
import { OPEN_CHIP_NONE, OpenChipId } from './chip-bar.helpers';
import { DataModelChipComponent } from './data-model-chip.component';
import { FilterChipComponent } from './filter-chip.component';
import { ResourceClassChipComponent } from './resource-class-chip.component';

@Component({
  selector: 'app-filter-chip-bar',
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
        <app-resource-class-chip />

        @for (stmt of confirmedStatements(); track stmt.id) {
          <app-filter-chip
            [statement]="stmt"
            [isOpen]="openChipId() === stmt.id"
            [isValid]="stmt.isValidAndComplete"
            (openChange)="onChipOpenChange(stmt.id, $event)"
            (remove)="onRemoveStatement(stmt)"
            (confirm)="onConfirmNewFilter(stmt.id)"
            (cancel)="onCancelNewFilter(stmt)" />
          @for (child of getChildStatements(stmt.id); track child.id) {
            <app-filter-chip
              class="chip--indented"
              [statement]="child"
              [isOpen]="openChipId() === child.id"
              [isValid]="child.isValidAndComplete"
              (openChange)="onChipOpenChange(child.id, $event)"
              (remove)="formManager.deleteStatement(child)"
              (confirm)="onConfirmNewFilter(child.id)"
              (cancel)="onCancelNewFilter(child)" />
          }
        }

        <app-add-filter-button (filterConfirmed)="onFilterConfirmed($event)" />
        <app-order-by />
      </div>
    }
  `,
  styleUrl: './filter-chip-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterChipBarComponent implements OnInit {
  @Input({ required: true }) projectUuid!: string;
  @Output() gravsearchQuery = new EventEmitter<string | null>();

  private readonly _searchStateService = inject(SearchStateService);
  private readonly _ontologyDataService = inject(OntologyDataService);
  private readonly _gravsearchService = inject(GravsearchService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _urlSync = inject(SearchUrlSyncService);
  readonly formManager = inject(PropertyFormManager);

  readonly openChipId = signal<OpenChipId>(OPEN_CHIP_NONE);
  readonly fulltextControl = new FormControl<string>('');
  readonly confirmedStatements = signal<StatementElement[]>([]);

  readonly ontologyLoading$ = this._ontologyDataService.ontologyLoading$;

  get projectIri(): string {
    return `http://rdfh.ch/projects/${this.projectUuid}`;
  }

  ngOnInit(): void {
    // Fulltext field is the only reactive writer — debounce and push to URL.
    this.fulltextControl.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this._destroyRef))
      .subscribe(q => this._urlSync.writeState({ q: q ?? undefined }));

    // URL is the single source of truth — every param change drives state.
    this._urlSync.queryParams$
      .pipe(
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(params => {
        this._resetState();
        this._ontologyDataService.ontologyLoading$
          .pipe(
            filter(loading => !loading),
            take(1),
            takeUntilDestroyed(this._destroyRef)
          )
          .subscribe(() => this._restoreFromUrl(params));
      });
  }

  onChipOpenChange(chipId: string, isOpen: boolean): void {
    this.openChipId.set(isOpen ? chipId : OPEN_CHIP_NONE);
  }

  onCancelNewFilter(stmt: StatementElement): void {
    this.formManager.deleteStatement(stmt);
    this.openChipId.set(OPEN_CHIP_NONE);
  }

  onConfirmNewFilter(chipId: string): void {
    this.openChipId.set(OPEN_CHIP_NONE);
    this._writeFiltersToUrl();
  }

  onFilterConfirmed(chipId: string): void {
    const stmt = this._searchStateService.currentState.statementElements.find(s => s.id === chipId);
    if (stmt) {
      this.confirmedStatements.update(stmts => [...stmts, stmt]);
      this._writeFiltersToUrl();
    }
  }

  onRemoveStatement(stmt: StatementElement): void {
    this.formManager.deleteStatement(stmt);
    this.confirmedStatements.update(stmts => stmts.filter(s => s.id !== stmt.id));
    this._writeFiltersToUrl();
  }

  getChildStatements(parentId: string): StatementElement[] {
    return this._searchStateService.currentState.statementElements.filter(
      s => s.parentId === parentId && !s.isPristine
    );
  }

  onReset(): void {
    this._resetState();
    this._urlSync.clearAll();
  }

  private _resetState(): void {
    this.fulltextControl.reset('', { emitEvent: false });
    this.confirmedStatements.set([]);
    this.openChipId.set(OPEN_CHIP_NONE);
    this._searchStateService.clearAllSelections();
  }

  private _writeFiltersToUrl(): void {
    const stmts = this.confirmedStatements();
    const encoded = stmts.length
      ? this._urlSync.encodeFilters(
          stmts.map((stmt, i) => {
            const parentIdx = stmt.parentId ? stmts.findIndex(s => s.id === stmt.parentId) : undefined;
            return {
              predicateIri: stmt.selectedPredicate!.iri,
              operator: stmt.selectedOperator!,
              value: stmt.selectedObjectWriteValue ?? '',
              parentIndex: parentIdx !== undefined && parentIdx >= 0 ? parentIdx : undefined,
            };
          })
        )
      : null;

    const activeOrderBy = this._searchStateService.currentState.orderBy.find(o => o.orderBy);
    this._urlSync.writeState({
      filters: encoded ?? undefined,
      orderBy: activeOrderBy?.id,
    });
  }

  private _restoreFromUrl(params: SearchUrlParams): void {
    // Ensure the correct ontology is loaded.
    const currentOntologyIri = this._ontologyDataService.selectedOntology.iri;
    if (params.ontology && params.ontology !== currentOntologyIri) {
      this._ontologyDataService.setOntology(params.ontology);
      // setOntology triggers ontologyLoading$ again — wait for it to settle before continuing.
      this._ontologyDataService.ontologyLoading$
        .pipe(
          filter(loading => !loading),
          take(1),
          takeUntilDestroyed(this._destroyRef)
        )
        .subscribe(() => this._applyParams(params));
      return;
    }
    if (!params.ontology && currentOntologyIri) {
      this._urlSync.writeState({ ontology: currentOntologyIri });
    }
    this._applyParams(params);
  }

  private _applyParams(params: SearchUrlParams): void {
    const classRestore$ = params.class
      ? this._ontologyDataService.resourceClasses$.pipe(
          filter(classes => classes.length > 0),
          take(1),
          switchMap(classes => {
            const found = classes.find(c => c.iri === params.class);
            if (found) this.formManager.setMainResource(found);
            return params.filters ? this._ontologyDataService.getProperties$().pipe(take(1)) : of(null);
          })
        )
      : params.filters
        ? this._ontologyDataService.getProperties$().pipe(take(1))
        : of(null);

    classRestore$.subscribe(predicates => {
      if (predicates && params.filters) {
        const filterParams = this._urlSync.decodeFilters(params.filters);
        const statements: StatementElement[] = filterParams.reduce((acc, fp) => {
          if (fp.parentIndex !== null && fp.parentIndex >= acc.length) return acc;
          const predicate = predicates.find(p => p.iri === fp.predicateIri);
          if (!predicate) return acc;
          const parentStmt = fp.parentIndex !== null ? acc[fp.parentIndex] : undefined;
          const stmt = new StatementElement(
            parentStmt?.selectedObjectNode instanceof NodeValue ? parentStmt.selectedObjectNode : undefined,
            parentStmt ? parentStmt.statementLevel + 1 : 0,
            parentStmt
          );
          stmt.selectedPredicate = predicate;
          if (fp.operator) stmt.selectedOperator = fp.operator;
          if (fp.value) stmt.selectedObjectValue = fp.value;
          return [...acc, stmt];
        }, [] as StatementElement[]);

        this._searchStateService.patchState({
          statementElements: [...this._searchStateService.currentState.statementElements, ...statements],
        });
        this.confirmedStatements.set(statements.filter(s => s.isValidAndComplete));
      }

      if (params.orderBy) {
        const orderByList = this._searchStateService.currentState.orderBy;
        const target = orderByList.find(o => o.id === params.orderBy);
        if (target) {
          target.orderBy = true;
          this._searchStateService.updateOrderBy(orderByList);
        }
      }

      this.fulltextControl.setValue(params.q ?? '', { emitEvent: false });

      this._emitSearch();
    });
  }

  private _emitSearch(): void {
    const fulltext = this.fulltextControl.value ?? '';
    const hasFilters = this.confirmedStatements().length > 0;
    const hasResourceClass = !!this._searchStateService.currentState.selectedResourceClass?.iri;
    if (!fulltext && !hasFilters && !hasResourceClass) {
      this.gravsearchQuery.emit(null);
      return;
    }
    const query = this._gravsearchService.generateGravSearchQuery(
      this._searchStateService.validStatementElements,
      fulltext
    );
    this.gravsearchQuery.emit(query);
  }
}
