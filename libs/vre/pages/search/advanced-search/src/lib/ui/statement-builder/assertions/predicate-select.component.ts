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
import { take } from 'rxjs';
import { IriLabelPair, Predicate } from '../../../model';
import { OntologyDataService } from '../../../service/ontology-data.service';

@Component({
  selector: 'app-predicate-select',
  standalone: true,
  imports: [CommonModule, MatSelectModule, StringifyStringLiteralPipe, TranslateModule],
  template: `
    <mat-form-field class="width-100-percent" appearance="fill">
      <mat-label>
        @let subject = subjectClass;
        @if (subject?.iri && subject?.labels?.length) {
          {{
            'pages.search.advancedSearch.propertyOfClass'
              | translate: { class: subject!.labels | appStringifyStringLiteral }
          }}
        } @else {
          {{ 'pages.search.advancedSearch.property' | translate }}
        }
      </mat-label>
      <mat-select
        [value]="selectedPredicate"
        (selectionChange)="selectedPredicateChange.emit($event.value)"
        data-cy="predicate-select"
        [compareWith]="compareObjects">
        @for (prop of properties; track prop.iri) {
          <mat-option [value]="prop" [attr.data-cy]="prop.labels | appStringifyStringLiteral">
            {{ prop.labels | appStringifyStringLiteral }}
          </mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styleUrl: '../../../advanced-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PredicateSelectComponent implements OnChanges {
  private readonly _dataService = inject(OntologyDataService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() subjectClass?: IriLabelPair;
  @Input() selectedPredicate?: Predicate;

  @Output() selectedPredicateChange = new EventEmitter<Predicate>();

  properties: Predicate[] = [];

  ngOnChanges(): void {
    this._dataService
      .getProperties$(this.subjectClass?.iri)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(properties => {
        this.properties = properties;
      });
  }

  compareObjects(object1: Predicate | IriLabelPair, object2: Predicate | IriLabelPair) {
    return object1 && object2 && object1.iri === object2.iri;
  }
}
