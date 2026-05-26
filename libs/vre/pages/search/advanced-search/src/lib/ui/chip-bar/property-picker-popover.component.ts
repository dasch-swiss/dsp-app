import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { BehaviorSubject, combineLatest, map, switchMap } from 'rxjs';
import { IriLabelPair, Predicate } from '../../model';
import { OntologyDataService } from '../../service/ontology-data.service';

@Component({
  selector: 'app-property-picker-popover',
  standalone: true,
  imports: [AsyncPipe, FormsModule, MatInputModule, MatListModule],
  template: `
    <div class="property-picker mat-elevation-z4">
      <mat-form-field class="property-picker__search">
        <mat-label>Search property</mat-label>
        <input matInput [(ngModel)]="searchTerm" (ngModelChange)="onSearch($event)" />
      </mat-form-field>

      <mat-selection-list
        class="property-picker__list"
        [multiple]="false"
        (selectionChange)="onPropertySelected($event.options[0]?.value)">
        @for (prop of filteredProperties$ | async; track prop.iri) {
          <mat-list-option [value]="prop">{{ prop.label }}</mat-list-option>
        }
      </mat-selection-list>
    </div>
  `,
  styles: [`
    .property-picker {
      background: white;
      border-radius: 4px;
      width: 260px;
    }
    .property-picker__search {
      width: 100%;
      padding: 8px 16px 0;
    }
    .property-picker__list {
      max-height: 280px;
      overflow-y: auto;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyPickerPopoverComponent implements OnChanges {
  @Input() subjectClassIri?: string;
  @Output() propertySelected = new EventEmitter<Predicate>();

  private readonly _dataService = inject(OntologyDataService);
  private readonly _searchFilter$ = new BehaviorSubject<string>('');
  private readonly _classIri$ = new BehaviorSubject<string | undefined>(undefined);

  searchTerm = '';

  readonly filteredProperties$ = combineLatest([
    this._classIri$.pipe(switchMap(iri => this._dataService.getProperties$(iri))),
    this._searchFilter$,
  ]).pipe(
    map(([props, term]) =>
      term ? props.filter(p => p.label.toLowerCase().includes(term.toLowerCase())) : props
    )
  );

  ngOnChanges(): void {
    this._classIri$.next(this.subjectClassIri);
  }

  onSearch(term: string): void {
    this._searchFilter$.next(term);
  }

  onPropertySelected(prop: IriLabelPair | null): void {
    if (prop) this.propertySelected.emit(prop as Predicate);
  }
}
