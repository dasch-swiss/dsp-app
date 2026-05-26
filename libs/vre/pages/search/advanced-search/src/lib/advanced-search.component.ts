import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { take } from 'rxjs';
import { provideAdvancedSearch } from './providers';
import { OntologyDataService } from './service/ontology-data.service';
import { SearchStateStorageService } from './service/search-state-storage.service';
import { SearchStateService } from './service/search-state.service';
import { FilterChipBarComponent } from './ui/chip-bar/filter-chip-bar.component';

@Component({
  selector: 'app-advanced-search',
  standalone: true,
  imports: [FilterChipBarComponent, MatButtonModule],
  template: `
    <app-filter-chip-bar [projectUuid]="projectUuid" (gravsearchQuery)="gravsearchQuery.emit($event)" />

    @if (hasPreviousSearch) {
      <button mat-button (click)="restoreSearchFromSnapshot()">Use previous search</button>
    }
  `,
  styleUrls: ['./advanced-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideAdvancedSearch()],
})
export class AdvancedSearchComponent implements OnInit {
  @Input({ required: true }) projectUuid!: string;
  @Input() queryToLoad?: string;
  @Input() restoreState = false;
  @Output() gravsearchQuery = new EventEmitter<string>();

  private readonly _dataService = inject(OntologyDataService);
  private readonly _searchState = inject(SearchStateService);
  private readonly _storageService = inject(SearchStateStorageService);

  get projectIri(): string {
    return `http://rdfh.ch/projects/${this.projectUuid}`;
  }

  get hasPreviousSearch(): boolean {
    return !!this._storageService.getPreviousSearchForQuery(this.queryToLoad);
  }

  ngOnInit(): void {
    this._storageService.setProjectUuid(this.projectUuid);

    if (this.queryToLoad) {
      this.restoreSearchFromSnapshot();
    } else if (this.restoreState) {
      const latestSnapshot = this._storageService.getLatestSearchSnapshot();
      if (latestSnapshot) {
        this._dataService.selectedOntology$.pipe(take(1)).subscribe(() => {
          this._searchState.patchState(latestSnapshot);
        });
        this._dataService.init(this.projectIri, latestSnapshot.selectedOntology);
      } else {
        this._dataService.init(this.projectIri);
      }
    } else {
      this._dataService.init(this.projectIri);
    }
  }

  restoreSearchFromSnapshot(): void {
    const snapshot = this._storageService.getPreviousSearchForQuery(this.queryToLoad);
    if (snapshot) {
      this._dataService.selectedOntology$.pipe(take(1)).subscribe(() => {
        this._searchState.patchState(snapshot);
      });
      this._dataService.init(this.projectIri, snapshot.selectedOntology);
    }
  }
}
