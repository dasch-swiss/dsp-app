import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IriLabelPair, PropertyObjectType, StatementElement } from '../../model';
import { StatementDraftStore } from '../../service/statement-draft.store';
import { ComparisonOperatorComponent } from './assertions/comparison-operator.component';
import { PredicateSelectComponent } from './assertions/predicate-select.component';
import { LinkValueComponent } from './object-values/link-value/link-value.component';
import { ListValueComponent } from './object-values/list-value/list-value.component';
import { ResourceValueComponent } from './object-values/resource-value/resource-value.component';
import { StringValueComponent } from './object-values/string-value/string-value.component';

/**
 * Renders the predicate / operator / object-value inputs for a single {@link StatementElement}, and —
 * when that statement opens a sub-query (link property + Matches with a resource class picked, i.e.
 * `objectType === ResourceObject`) — recursively renders one `app-statement-fields` per subcriterion
 * plus an "Add subcriteria" action. Because it renders itself for children, subcriteria nest to any
 * depth. All editing goes through {@link StatementDraftStore}; this component owns no statement state.
 */
@Component({
  selector: 'app-statement-fields',
  standalone: true,
  imports: [
    ComparisonOperatorComponent,
    LinkValueComponent,
    ListValueComponent,
    MatButtonModule,
    MatIconModule,
    PredicateSelectComponent,
    ResourceValueComponent,
    StringValueComponent,
  ],
  template: `
    <div class="statement-fields__row">
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
            [showError]="showErrors"
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
            [showError]="showErrors"
            (emitResourceSelected)="draftStore.setObjectValue(statement, $event)" />
        }
      }

      @if (isSubcriterion) {
        <button
          class="statement-fields__remove"
          mat-icon-button
          type="button"
          aria-label="Remove subcriteria"
          (click)="draftStore.deleteStatement(statement)">
          <mat-icon>close</mat-icon>
        </button>
      }
    </div>

    @if (statement.objectType === PROPERTY_OBJECT_TYPES.ResourceObject) {
      <div class="statement-fields__children">
        @for (child of draftStore.childrenOf(statement); track child.id) {
          <app-statement-fields [statement]="child" [isSubcriterion]="true" [showErrors]="showErrors" />
        }
        <button
          class="statement-fields__add-sub"
          mat-stroked-button
          type="button"
          (click)="draftStore.addChildStatement(statement)">
          <mat-icon>add</mat-icon>
          Add subcriteria
        </button>
      </div>
    }
  `,
  styles: [
    `
      .statement-fields__row {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        gap: 8px;
      }
      .statement-fields__row > app-predicate-select,
      .statement-fields__row > app-comparison-operator,
      .statement-fields__row > app-resource-value,
      .statement-fields__row > app-string-value,
      .statement-fields__row > app-list-value,
      .statement-fields__row > app-link-value {
        flex: 1 1 0;
        min-width: 0;
      }
      .statement-fields__remove {
        flex: 0 0 auto;
      }
      /* Subcriteria are indented under their parent to make the nesting legible. */
      .statement-fields__children {
        margin-left: 24px;
        margin-top: 8px;
        padding-left: 12px;
        border-left: 2px solid rgba(0, 0, 0, 0.12);
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatementFieldsComponent {
  @Input({ required: true }) statement!: StatementElement;
  /** True when this row is a subcriterion (renders a remove affordance); false for the top-level row. */
  @Input() isSubcriterion = false;
  /** Mirror the popover's error state so incomplete rows highlight on a failed confirm; passed to children. */
  @Input() showErrors = false;

  readonly draftStore = inject(StatementDraftStore);
  readonly PROPERTY_OBJECT_TYPES = PropertyObjectType;

  asString(value: string | IriLabelPair | undefined): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  asIriLabelPair(value: string | IriLabelPair | undefined): IriLabelPair | undefined {
    return value && typeof value === 'object' ? value : undefined;
  }
}
