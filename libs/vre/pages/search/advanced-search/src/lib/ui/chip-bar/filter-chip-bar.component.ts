import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingButtonDirective } from '@dasch-swiss/vre/ui/progress-indicator';
import { map } from 'rxjs';
import { StatementElement } from '../../model';
import { GravsearchService } from '../../service/gravsearch.service';
import { OntologyDataService } from '../../service/ontology-data.service';
import { PropertyFormManager } from '../../service/property-form.manager';
import { QueryExecutionService } from '../../service/query-execution.service';
import { SearchStateService } from '../../service/search-state.service';
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
    LoadingButtonDirective,
    MatButtonModule,
    MatProgressBarModule,
    OrderByComponent,
    ResourceClassChipComponent,
  ],
  template: `
    @if (ontologyLoading$ | async) {
      <mat-progress-bar mode="query" />
    } @else {
      <div class="chip-bar">
        @let searchEnabled = searchEnabled$ | async;

        <app-data-model-chip />
        <app-resource-class-chip />

        @for (stmt of visibleStatements$ | async; track stmt.id) {
          <app-filter-chip
            [statement]="stmt"
            [isOpen]="openChipId() === stmt.id"
            [isValid]="stmt.isValidAndComplete"
            (openChange)="onChipOpenChange(stmt.id, $event)"
            (remove)="formManager.deleteStatement(stmt)" />
          @for (child of getChildStatements(stmt.id); track child.id) {
            <app-filter-chip
              class="chip--indented"
              [statement]="child"
              [isOpen]="openChipId() === child.id"
              [isValid]="child.isValidAndComplete"
              (openChange)="onChipOpenChange(child.id, $event)"
              (remove)="formManager.deleteStatement(child)" />
          }
        }

        <app-add-filter-button (filterAdded)="onFilterAdded($event)" />
        <app-order-by />

        <span class="chip-bar__spacer"></span>

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
    }
  `,
  styleUrl: './filter-chip-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterChipBarComponent {
  @Input({ required: true }) projectUuid!: string;
  @Output() gravsearchQuery = new EventEmitter<string>();

  private readonly _searchStateService = inject(SearchStateService);
  private readonly _ontologyDataService = inject(OntologyDataService);
  private readonly _gravsearchService = inject(GravsearchService);
  readonly formManager = inject(PropertyFormManager);
  readonly queryExecutionService = inject(QueryExecutionService);

  readonly openChipId = signal<OpenChipId>(OPEN_CHIP_NONE);

  readonly ontologyLoading$ = this._ontologyDataService.ontologyLoading$;

  readonly visibleStatements$ = this._searchStateService.statementElements$.pipe(
    map(stmts => stmts.filter(s => !s.isPristine))
  );

  readonly searchEnabled$ = this._searchStateService.isFormStateValidAndComplete$;

  get projectIri(): string {
    return `http://rdfh.ch/projects/${this.projectUuid}`;
  }

  onChipOpenChange(chipId: string, isOpen: boolean): void {
    this.openChipId.set(isOpen ? chipId : OPEN_CHIP_NONE);
  }

  onFilterAdded(chipId: string): void {
    this.openChipId.set(chipId);
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
    this.gravsearchQuery.emit(query);
  }
}
