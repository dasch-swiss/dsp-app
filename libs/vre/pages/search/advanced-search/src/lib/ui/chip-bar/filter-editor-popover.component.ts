import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { IriLabelPair, PropertyObjectType, StatementElement } from '../../model';
import { StatementDraftStore } from '../../service/statement-draft.store';
import { ComparisonOperatorComponent } from '../statement-builder/assertions/comparison-operator.component';
import { PredicateSelectComponent } from '../statement-builder/assertions/predicate-select.component';
import { LinkValueComponent } from '../statement-builder/object-values/link-value/link-value.component';
import { ListValueComponent } from '../statement-builder/object-values/list-value/list-value.component';
import { ResourceValueComponent } from '../statement-builder/object-values/resource-value/resource-value.component';
import { StringValueComponent } from '../statement-builder/object-values/string-value/string-value.component';

@Component({
  selector: 'app-filter-editor-popover',
  standalone: true,
  imports: [
    ComparisonOperatorComponent,
    LinkValueComponent,
    ListValueComponent,
    MatButtonModule,
    PredicateSelectComponent,
    ResourceValueComponent,
    StringValueComponent,
  ],
  template: `
    <div class="filter-editor-popover mat-elevation-z4">
      <div class="filter-editor-popover__fields">
        <app-predicate-select
          [subjectClass]="statement.subjectNode?.value"
          [selectedPredicate]="statement.selectedPredicate"
          (selectedPredicateChange)="draftStore.setSelectedPredicate(statement, $event)" />

        <app-comparison-operator
          [operators]="statement.operators"
          [selectedOperator]="statement.selectedOperator"
          (operatorChange)="draftStore.setSelectedOperator(statement, $event)" />

        @switch (statement.objectType) {
          @case (PROPERTY_OBJECT_TYPES.ResourceObject) {
            <app-resource-value
              [selectedPredicate]="statement.selectedPredicate"
              [selectedResource]="asIriLabelPair(statement.selectedObjectValue)"
              (selectedResourceChange)="draftStore.setObjectValue(statement, $event)" />
          }
          @case (PROPERTY_OBJECT_TYPES.ValueObject) {
            <app-string-value
              [valueType]="statement.selectedPredicate!.objectValueType"
              [value]="asString(statement.selectedObjectValue)"
              [showError]="showErrors()"
              (emitValueChanged)="draftStore.setObjectValue(statement, $event)" />
          }
          @case (PROPERTY_OBJECT_TYPES.ListValueObject) {
            <app-list-value
              [rootListNodeIri]="statement.selectedPredicate!.listObjectIri!"
              [selectedListItem]="asIriLabelPair(statement.selectedObjectValue)"
              (emitValueChanged)="draftStore.setObjectValue(statement, $event)" />
          }
          @case (PROPERTY_OBJECT_TYPES.LinkValueObject) {
            <app-link-value
              [resourceClass]="statement.selectedPredicate?.objectValueType"
              [selectedResource]="asIriLabelPair(statement.selectedObjectValue)"
              [showError]="showErrors()"
              (emitResourceSelected)="draftStore.setObjectValue(statement, $event)" />
          }
        }

        <button class="filter-editor-popover__add" mat-raised-button color="primary" (click)="onConfirmClick()">
          Add
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .filter-editor-popover {
        background: white;
        padding: 8px 12px;
        border-radius: 4px;
      }
      /* Single row: no wrapping. Fields shrink to share the row rather than dropping to a new line. */
      .filter-editor-popover__fields {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        gap: 8px;
      }
      /* Each field component shares the row and may shrink (min-width:0 lets flex compress the inner
         inputs below their content width instead of forcing an overflow/wrap). */
      .filter-editor-popover__fields > app-predicate-select,
      .filter-editor-popover__fields > app-comparison-operator,
      .filter-editor-popover__fields > app-resource-value,
      .filter-editor-popover__fields > app-string-value,
      .filter-editor-popover__fields > app-list-value,
      .filter-editor-popover__fields > app-link-value {
        flex: 1 1 0;
        min-width: 0;
      }
      /* The Add button anchors the row end and never stretches or shrinks. */
      .filter-editor-popover__add {
        flex: 0 0 auto;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterEditorPopoverComponent {
  @Input({ required: true }) statement!: StatementElement;
  @Input() isPristine = false;
  @Output() filterConfirm = new EventEmitter<void>();
  @Output() filterCancel = new EventEmitter<void>();

  readonly draftStore = inject(StatementDraftStore);
  readonly PROPERTY_OBJECT_TYPES = PropertyObjectType;
  readonly showErrors = signal(false);

  onConfirmClick(): void {
    if (!this.statement.isValidAndComplete) {
      this.showErrors.set(true);
      return;
    }
    this.filterConfirm.emit();
  }

  asString(value: string | IriLabelPair | undefined): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  asIriLabelPair(value: string | IriLabelPair | undefined): IriLabelPair | undefined {
    return value && typeof value === 'object' ? value : undefined;
  }
}
