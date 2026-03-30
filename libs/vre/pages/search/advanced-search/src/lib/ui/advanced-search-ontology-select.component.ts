import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { filter, map } from 'rxjs';
import { IriLabelPair } from '../model';
import { OntologyDataService } from '../service/ontology-data.service';
import { SearchStateService } from '../service/search-state.service';

@Component({
  selector: 'app-advanced-search-ontology-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSelectModule],
  template: `
    <mat-form-field class="width-100-percent">
      <mat-label>Data model</mat-label>
      <mat-select
        (selectionChange)="onSelectedOntologyChanged($event.value)"
        [value]="(selectedOntology$ | async)?.iri">
        @for (onto of ontologies$ | async; track onto.iri) {
          <mat-option [value]="onto.iri">{{ onto.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styleUrl: '../advanced-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchOntologySelectComponent {
  private dataService = inject(OntologyDataService);
  private searchStateService = inject(SearchStateService);

  ontologies$ = this.dataService.ontologies$;
  selectedOntology$ = this.dataService.selectedOntology$.pipe(
    filter(o => o !== null),
    map(o => ({ iri: o.id, label: o.label }) as IriLabelPair)
  );

  onSelectedOntologyChanged(ontologyIri: string): void {
    this.dataService.setOntology(ontologyIri);
    this.searchStateService.clearAllSelections();
  }
}
