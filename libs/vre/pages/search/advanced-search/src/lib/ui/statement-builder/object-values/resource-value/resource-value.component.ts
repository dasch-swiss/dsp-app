import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSelectModule } from '@angular/material/select';
import { BehaviorSubject } from 'rxjs';
import { IriLabelPair, Predicate } from '../../../../model';
import { OntologyDataService } from '../../../../service/ontology-data.service';

@Component({
  selector: 'app-resource-value',
  standalone: true,
  imports: [CommonModule, MatSelectModule],
  template: `
    <mat-form-field class="width-100-percent" appearance="fill">
      <mat-label>Resource Class</mat-label>
      <mat-select
        [value]="selectedResource"
        (selectionChange)="selectedResourceChange.emit($event.value)"
        data-cy="resource-class-select"
        [compareWith]="compareObjects"
        required>
        @for (resClass of availableResources$ | async; track resClass.iri) {
          <mat-option [attr.data-cy]="resClass.label" [value]="resClass">
            {{ resClass.label }}
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
  private readonly destroyRef = inject(DestroyRef);

  @Input() selectedResource?: IriLabelPair;
  @Input() selectedPredicate?: Predicate;

  @Output() selectedResourceChange = new EventEmitter<IriLabelPair>();

  availableResources$ = new BehaviorSubject<IriLabelPair[]>([]);

  ngOnChanges(): void {
    this._dataService
      .getResourceClassObjectsForProperty$(this.selectedPredicate?.iri)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(resources => {
        this.availableResources$.next(resources);
      });
  }

  compareObjects(object1: IriLabelPair, object2: IriLabelPair) {
    return object1 && object2 && object1.iri === object2.iri;
  }
}
