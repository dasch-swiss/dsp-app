import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { LoadingButtonDirective } from '@dasch-swiss/vre/ui/progress-indicator';
import { map } from 'rxjs';
import { StatementElement } from '../../model';
import { GravsearchService } from '../../service/gravsearch.service';
import { OntologyDataService } from '../../service/ontology-data.service';
import { PropertyFormManager } from '../../service/property-form.manager';
import { QueryExecutionService } from '../../service/query-execution.service';
import { SearchStateService } from '../../service/search-state.service';
import { SearchStateStorageService } from '../../service/search-state-storage.service';
import { OrderByComponent } from '../order-by/order-by.component';
import { OPEN_CHIP_NONE, OpenChipId } from './chip-bar.helpers';

@Component({
  selector: 'app-filter-chip-bar',
  standalone: true,
  imports: [AsyncPipe, MatButtonModule, OrderByComponent, LoadingButtonDirective],
  template: `
    <div class="chip-bar">
      @let searchEnabled = searchEnabled$ | async;

      <span class="chip-bar__spacer"></span>

      <app-order-by />

      <button mat-stroked-button (click)="onReset()">Reset</button>
      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="queryExecutionService.queryIsExecuting()"
        [disabled]="searchEnabled === false"
        (click)="onSearch()">
        Search
      </button>
    </div>
  `,
  styleUrl: './filter-chip-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterChipBarComponent implements OnInit {
  @Input({ required: true }) projectUuid!: string;
  @Output() gravsearchQuery = new EventEmitter<string>();

  private readonly _searchStateService = inject(SearchStateService);
  private readonly _ontologyDataService = inject(OntologyDataService);
  private readonly _gravsearchService = inject(GravsearchService);
  private readonly _storageService = inject(SearchStateStorageService);
  readonly formManager = inject(PropertyFormManager);
  readonly queryExecutionService = inject(QueryExecutionService);

  readonly openChipId = signal<OpenChipId>(OPEN_CHIP_NONE);

  readonly ontologyLabel$ = this._ontologyDataService.selectedOntology$.pipe(map(o => o?.label ?? '…'));

  readonly resourceClassLabel$ = this._searchStateService.selectedResourceClass$.pipe(
    map(rc => rc?.label || 'All resource classes')
  );

  readonly visibleStatements$ = this._searchStateService.statementElements$.pipe(
    map(stmts => stmts.filter(s => !s.isPristine))
  );

  readonly searchEnabled$ = this._searchStateService.isFormStateValidAndComplete$;

  get projectIri(): string {
    return `http://rdfh.ch/projects/${this.projectUuid}`;
  }

  ngOnInit(): void {
    this._ontologyDataService.init(this.projectIri);
  }

  onChipOpenChange(chipId: string, isOpen: boolean): void {
    this.openChipId.set(isOpen ? chipId : OPEN_CHIP_NONE);
  }

  getChildStatements(parentId: string): StatementElement[] {
    return this._searchStateService.currentState.statementElements.filter(
      s => s.parentId === parentId && !s.isPristine
    );
  }

  onReset(): void {
    this._searchStateService.clearAllSelections();
    this._ontologyDataService.init(this.projectIri);
  }

  onSearch(): void {
    const query = this._gravsearchService.generateGravSearchQuery(this._searchStateService.validStatementElements);
    this._storageService.storeSearchSnapshot(
      query,
      this._ontologyDataService.selectedOntology,
      this._searchStateService.currentState
    );
    this.gravsearchQuery.emit(query);
  }
}
