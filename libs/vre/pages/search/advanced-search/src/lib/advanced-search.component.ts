import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { map } from 'rxjs';
import { SEARCH_ALL_RESOURCE_CLASSES_OPTION } from './constants';
import { QueryObject } from './model';
import { provideAdvancedSearch } from './providers';
import { GravsearchService } from './service/gravsearch.service';
import { OntologyDataService } from './service/ontology-data.service';
import { PropertyFormManager } from './service/property-form.manager';
import { SearchStateService } from './service/search-state.service';
import { AdvancedSearchFooterComponent } from './ui/advanced-search-footer.component';
import { AdvancedSearchHeaderComponent } from './ui/advanced-search-header.component';
import { AdvancedSearchOntologySelectComponent } from './ui/advanced-search-ontology-select.component';
import { ResourceValueComponent } from './ui/statement-builder/object-values/resource-value/resource-value.component';
import { StatementBuilderComponent } from './ui/statement-builder/statement-builder.component';

@Component({
  selector: 'app-advanced-search',
  standalone: true,
  imports: [
    CommonModule,
    AdvancedSearchHeaderComponent,
    AdvancedSearchFooterComponent,
    AdvancedSearchOntologySelectComponent,
    StatementBuilderComponent,
    MatProgressBar,
    ResourceValueComponent,
  ],
  template: `
    @let ontologyLoading = ontologyLoading$ | async;
    <app-advanced-search-header
      style="display: block; margin-bottom: 24px"
      [isVerticalDirection]="isVerticalDirection"
      (toggleDirection)="toggleDirection.emit()" />
    <app-advanced-search-ontology-form />
    @if (ontologyLoading) {
      <mat-progress-bar mode="query" />
    }
    @if (!ontologyLoading) {
      <app-resource-value
        class="width-100-percent"
        [selectedResource]="selectedResourceClass$ | async"
        (selectedResourceChange)="formManager.setMainResource($event)" />
      <app-statement-builder [statementElements]="(searchState.statementElements$ | async) || []" />
      <app-advanced-search-footer
        class="flex-space-between margin-top-1em"
        (searchTriggered)="doSearch()"
        (resetTriggered)="resetSearch()" />
    }
  `,
  styleUrls: ['./advanced-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideAdvancedSearch()],
})
export class AdvancedSearchComponent implements OnInit {
  @Input({ required: true }) projectUuid!: string;
  @Input({ required: true }) isVerticalDirection: boolean | undefined;
  @Output() toggleDirection = new EventEmitter<any>();
  @Output() gravesearchQuery = new EventEmitter<string>();
  @Output() clearQuery = new EventEmitter<any>();

  searchState: SearchStateService = inject(SearchStateService);
  formManager: PropertyFormManager = inject(PropertyFormManager);

  private _dataService: OntologyDataService = inject(OntologyDataService);
  private _gravsearchService: GravsearchService = inject(GravsearchService);

  ontologyLoading$ = this._dataService.ontologyLoading$;

  selectedResourceClass$ = this.searchState.selectedResourceClass$.pipe(
    map(selectedClass => selectedClass || SEARCH_ALL_RESOURCE_CLASSES_OPTION)
  );

  get projectIri() {
    return `http://rdfh.ch/projects/${this.projectUuid}`;
  }

  ngOnInit(): void {
    this._dataService.init(this.projectIri);
  }

  doSearch(): void {
    const query = this._gravsearchService.generateGravSearchQuery(this.searchState.validStatementElements);
    const queryObject: QueryObject = {
      query,
      properties: this.searchState.validStatementElements,
    };
    this.gravesearchQuery.emit(queryObject.query);
  }

  resetSearch(): void {
    this.searchState.clearAllSelections();
    this._dataService.init(this.projectIri);
    this.clearQuery.emit();
  }
}
