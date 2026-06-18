import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, switchMap } from 'rxjs';
import { ALL_RESOURCE_CLASSES } from '../../../../constants';
import { IriLabelPair, Predicate } from '../../../../model';
import { OntologyDataService } from '../../../../service/ontology-data.service';

@Component({
  selector: 'app-resource-value',
  standalone: true,
  imports: [CommonModule, MatSelectModule, TranslateModule, StringifyStringLiteralPipe],
  template: `
    <mat-form-field class="width-100-percent" appearance="fill">
      <mat-label>{{ 'pages.search.advancedSearch.resourceClass' | translate }}</mat-label>
      <mat-select
        [value]="selectedResource"
        (selectionChange)="selectedResourceChange.emit($event.value)"
        data-cy="resource-class-select"
        [compareWith]="compareObjects"
        required>
        @if (!selectedPredicate) {
          <mat-option [value]="allResourceClassesOption">
            {{ 'pages.search.advancedSearch.allResourceClasses' | translate }}
          </mat-option>
        }
        @for (resClass of availableResources$ | async; track resClass.iri) {
          <mat-option [attr.data-cy]="resClass.labels | appStringifyStringLiteral" [value]="resClass">
            {{ resClass.labels | appStringifyStringLiteral }}
          </mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styleUrl: '../../../../advanced-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceValueComponent implements OnChanges {
  private readonly _dataService = inject(OntologyDataService);

  @Input() selectedResource?: IriLabelPair;
  @Input() selectedPredicate?: Predicate;

  @Output() selectedResourceChange = new EventEmitter<IriLabelPair>();

  // Drives a single long-lived stream; `ngOnChanges` pushes new IRIs in.
  // Async pipe in the template owns the subscription lifecycle.
  private readonly _selectedPredicateIri$ = new BehaviorSubject<string | undefined>(undefined);
  availableResources$ = this._selectedPredicateIri$.pipe(
    switchMap(iri => this._dataService.getResourceClassObjectsForProperty$(iri))
  );

  readonly allResourceClassesOption: IriLabelPair = ALL_RESOURCE_CLASSES;

  ngOnChanges(): void {
    this._selectedPredicateIri$.next(this.selectedPredicate?.iri);
  }

  compareObjects(object1: IriLabelPair, object2: IriLabelPair) {
    return object1 && object2 && object1.iri === object2.iri;
  }
}
