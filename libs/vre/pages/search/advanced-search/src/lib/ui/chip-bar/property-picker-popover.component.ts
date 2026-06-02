import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { BehaviorSubject, map, switchMap } from 'rxjs';
import { IriLabelPair, Predicate } from '../../model';
import { OntologyDataService } from '../../service/ontology-data.service';

@Component({
  selector: 'app-property-picker-popover',
  standalone: true,
  imports: [AsyncPipe, MatListModule],
  template: `
    <div class="property-picker mat-elevation-z4">
      <mat-selection-list
        class="property-picker__list"
        [multiple]="false"
        [hideSingleSelectionIndicator]="true"
        (selectionChange)="onPropertySelected($event.options[0]?.value)">
        @for (prop of filteredProperties$ | async; track prop.iri) {
          <mat-list-option [value]="prop">{{ prop.label }}</mat-list-option>
        }
      </mat-selection-list>
    </div>
  `,
  styles: [
    `
      .property-picker {
        background: white;
        border-radius: 4px;
        width: 260px;
      }
      .property-picker__list {
        max-height: 280px;
        overflow-y: auto;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyPickerPopoverComponent implements OnChanges {
  @Input() subjectClassIri?: string;
  @Output() propertySelected = new EventEmitter<Predicate>();

  private readonly _dataService = inject(OntologyDataService);
  private readonly _classIri$ = new BehaviorSubject<string | undefined>(undefined);

  readonly filteredProperties$ = this._classIri$.pipe(switchMap(iri => this._dataService.getProperties$(iri)));

  ngOnChanges(): void {
    this._classIri$.next(this.subjectClassIri);
  }

  onPropertySelected(prop: IriLabelPair | null): void {
    if (prop) this.propertySelected.emit(prop as Predicate);
  }
}
