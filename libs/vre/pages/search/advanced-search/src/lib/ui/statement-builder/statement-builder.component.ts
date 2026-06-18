import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input, OnChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { PropertyObjectType, StatementElement } from '../../model';
import { PropertyFormManager } from '../../service/property-form.manager';
import { ComparisonOperatorComponent } from './assertions/comparison-operator.component';
import { PredicateSelectComponent } from './assertions/predicate-select.component';
import { LinkValueComponent } from './object-values/link-value/link-value.component';
import { ListValueComponent } from './object-values/list-value/list-value.component';
import { ResourceValueComponent } from './object-values/resource-value/resource-value.component';
import { StringValueComponent } from './object-values/string-value/string-value.component';

@Component({
  selector: 'app-statement-builder',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PredicateSelectComponent,
    ComparisonOperatorComponent,
    LinkValueComponent,
    ListValueComponent,
    ResourceValueComponent,
    StringValueComponent,
    TranslateModule,
  ],
  template: ` @for (
    statementElement of statementElements;
    track statementElement.id;
    let index = $index;
    let isLast = $last
  ) {
    @if (index === 0 || displayStatement(statementElement)) {
      <div style="display: flex; gap: 8px" [style.margin-left.em]="(statementElement.statementLevel + 1) * 2">
        <app-predicate-select
          class="min-width-25em"
          [selectedPredicate]="statementElement?.selectedPredicate"
          [subjectClass]="statementElement.subjectNode?.value"
          (selectedPredicateChange)="formManager.setSelectedPredicate(statementElement, $event)" />
        <app-comparison-operator
          [operators]="statementElement.operators"
          [selectedOperator]="statementElement.selectedOperator"
          (operatorChange)="formManager.setSelectedOperator(statementElement, $event)" />
        @switch (statementElement.objectType) {
          @case (PROPERTY_OBJECT_TYPES.ResourceObject) {
            <app-resource-value
              class="min-width-25em"
              [selectedPredicate]="statementElement.selectedPredicate"
              [selectedResource]="statementElement.selectedObjectValue"
              (selectedResourceChange)="formManager.setObjectValue(statementElement, $event)" />
          }
          @case (PROPERTY_OBJECT_TYPES.ValueObject) {
            <app-string-value
              class="width-40-percent"
              [valueType]="statementElement.selectedPredicate!.objectValueType"
              [value]="statementElement.selectedObjectValue"
              (emitValueChanged)="formManager.setObjectValue(statementElement, $event)" />
          }
          @case (PROPERTY_OBJECT_TYPES.ListValueObject) {
            <app-list-value
              class="width-40-percent"
              [rootListNodeIri]="statementElement.selectedPredicate!.listObjectIri"
              [selectedListItem]="statementElement.selectedObjectValue"
              (emitValueChanged)="formManager.setObjectValue(statementElement, $event)" />
          }
          @case (PROPERTY_OBJECT_TYPES.LinkValueObject) {
            <app-link-value
              class="width-40-percent"
              [resourceClass]="statementElement.selectedPredicate?.objectValueType"
              [selectedResource]="statementElement.selectedObjectValue"
              (emitResourceSelected)="formManager.setObjectValue(statementElement, $event)" />
          }
          @case (PROPERTY_OBJECT_TYPES.None) {
            <!-- No input needed -->
          }
        }
        @if (statementElement.isValidAndComplete && (index > 0 || statementElements.length > 1)) {
          <button
            mat-icon-button
            color="primary"
            (click)="formManager.deleteStatement(statementElement)"
            [matTooltip]="'pages.search.advancedSearch.tooltips.removeCriteria' | translate">
            <mat-icon>remove_circle</mat-icon>
          </button>
        }
        @if (!statementElement.isValidAndComplete && index > 0) {
          <button
            mat-icon-button
            color="primary"
            (click)="formManager.clearStatementElement(statementElement)"
            [matTooltip]="'pages.search.advancedSearch.tooltips.removeCriteria' | translate">
            <mat-icon>remove_circle</mat-icon>
          </button>
        }
      </div>
    } @else {
      <div [style.margin-left.em]="(statementElement.statementLevel + 1) * 2" class="margin-bottom-1em">
        <button
          mat-button
          mat-stroked-button
          color="primary"
          class="min-width-12em"
          (click)="displayForm(statementElement)"
          [matTooltip]="
            (statementElement.statementLevel === 0
              ? 'pages.search.advancedSearch.tooltips.addCriteria'
              : 'pages.search.advancedSearch.tooltips.addSubCriteria'
            ) | translate
          ">
          <mat-icon>add_circle</mat-icon>
          <span>{{
            (statementElement.statementLevel === 0
              ? 'pages.search.advancedSearch.tooltips.addCriteria'
              : 'pages.search.advancedSearch.tooltips.addSubCriteria'
            ) | translate
          }}</span>
        </button>
      </div>
    }
  }`,
  styleUrl: '../../advanced-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatementBuilderComponent implements OnChanges {
  @Input({ required: true }) statementElements: StatementElement[] = [new StatementElement()];

  formManager = inject(PropertyFormManager);

  protected readonly PROPERTY_OBJECT_TYPES = PropertyObjectType;

  displayBlankStatement = false;
  displayBlankChildStatement = false;

  ngOnChanges(): void {
    this.displayBlankStatement = false;
    this.displayBlankChildStatement = false;
  }

  displayStatement(statementElement: StatementElement): boolean {
    if (!statementElement.isPristine) {
      return true;
    }
    if (statementElement.statementLevel === 0 && this.displayBlankStatement) {
      return true;
    }
    return statementElement.statementLevel > 0 && this.displayBlankChildStatement;
  }

  displayForm(statementElement: StatementElement): void {
    if (statementElement.statementLevel === 0) {
      this.displayBlankStatement = true;
    } else {
      this.displayBlankChildStatement = true;
    }
  }
}
