import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { PropertyObjectType, StatementElement } from '../../model';
import { PropertyFormManager } from '../../service/property-form.manager';
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
    PredicateSelectComponent,
    ResourceValueComponent,
    StringValueComponent,
  ],
  template: `
    <div class="filter-editor-popover mat-elevation-z4">
      <app-predicate-select
        [subjectClass]="statement.subjectNode?.value"
        [selectedPredicate]="statement.selectedPredicate"
        (selectedPredicateChange)="formManager.setSelectedPredicate(statement, $event)" />

      @if (statement.selectedPredicate) {
        <app-comparison-operator
          [operators]="statement.operators"
          [selectedOperator]="statement.selectedOperator"
          (operatorChange)="formManager.setSelectedOperator(statement, $event)" />
      }

      @switch (statement.objectType) {
        @case (PROPERTY_OBJECT_TYPES.ResourceObject) {
          <app-resource-value
            [selectedPredicate]="statement.selectedPredicate"
            [selectedResource]="asIriLabelPair(statement.selectedObjectValue)"
            (selectedResourceChange)="formManager.setObjectValue(statement, $event)" />
        }
        @case (PROPERTY_OBJECT_TYPES.ValueObject) {
          <app-string-value
            [valueType]="statement.selectedPredicate!.objectValueType"
            [value]="asString(statement.selectedObjectValue)"
            (emitValueChanged)="formManager.setObjectValue(statement, $event)" />
        }
        @case (PROPERTY_OBJECT_TYPES.ListValueObject) {
          <app-list-value
            [rootListNodeIri]="statement.selectedPredicate!.listObjectIri!"
            [selectedListItem]="asIriLabelPair(statement.selectedObjectValue)"
            (emitValueChanged)="formManager.setObjectValue(statement, $event)" />
        }
        @case (PROPERTY_OBJECT_TYPES.LinkValueObject) {
          <app-link-value
            [resourceClass]="statement.selectedPredicate?.objectValueType"
            [selectedResource]="asIriLabelPair(statement.selectedObjectValue)"
            (emitResourceSelected)="formManager.setObjectValue(statement, $event)" />
        }
      }
    </div>
  `,
  styles: [
    `
      .filter-editor-popover {
        background: white;
        padding: 16px;
        border-radius: 4px;
        min-width: 280px;
        max-width: 400px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterEditorPopoverComponent {
  @Input({ required: true }) statement!: StatementElement;

  readonly formManager = inject(PropertyFormManager);
  readonly PROPERTY_OBJECT_TYPES = PropertyObjectType;

  asString(value: string | { iri: string; label: string } | undefined): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  asIriLabelPair(
    value: string | { iri: string; label: string } | undefined
  ): { iri: string; label: string } | undefined {
    return value && typeof value === 'object' ? value : undefined;
  }
}
