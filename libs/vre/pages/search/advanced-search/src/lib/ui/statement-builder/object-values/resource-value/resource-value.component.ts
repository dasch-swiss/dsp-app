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
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSelectModule } from '@angular/material/select';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, switchMap } from 'rxjs';
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
  private readonly destroyRef = inject(DestroyRef);

  @Input() selectedResource?: IriLabelPair;
  @Input() selectedPredicate?: Predicate;

  @Output() selectedResourceChange = new EventEmitter<IriLabelPair>();

  availableResources$ = new BehaviorSubject<IriLabelPair[]>([]);

  // Static sentinel matching the default in SearchStateService — empty iri means
  // "search across all resource classes" downstream (see gravsearch.service.ts).
  readonly allResourceClassesOption: IriLabelPair = { iri: '', labels: [], comments: [] };

  // Drives a single long-lived subscription; `ngOnChanges` pushes new IRIs in.
  private readonly _selectedPredicateIri$ = new BehaviorSubject<string | undefined>(undefined);

  constructor() {
    this._selectedPredicateIri$
      .pipe(
        switchMap(iri => this._dataService.getResourceClassObjectsForProperty$(iri)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(resources => this.availableResources$.next(resources));
  }

  ngOnChanges(): void {
    this._selectedPredicateIri$.next(this.selectedPredicate?.iri);
  }

  compareObjects(object1: IriLabelPair, object2: IriLabelPair) {
    return object1 && object2 && object1.iri === object2.iri;
  }
}
