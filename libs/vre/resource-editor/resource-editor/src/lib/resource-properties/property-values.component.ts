import { ChangeDetectionStrategy, Component, inject, Input, OnChanges } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Cardinality, ReadResource, ReadValue } from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { TranslatePipe } from '@ngx-translate/core';
import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { ResourceUtil } from '../representations/resource.util';
import { JsLibPotentialError } from './JsLibPotentialError';
import { DraggableValueListComponent } from './draggable-value-list.component';
import { PropertyValueAddComponent } from './property-value-add.component';
import { PropertyValueComponent } from './property-value.component';
import { PropertyValueService } from './property-value.service';

@Component({
  selector: 'app-property-values',
  imports: [
    DraggableValueListComponent,
    MatIconButton,
    MatIcon,
    PropertyValueComponent,
    PropertyValueAddComponent,
    MatTooltip,
    TranslatePipe,
  ],
  template: `
    <app-draggable-value-list
      [values]="editModeData.values"
      [resourceIri]="editModeData.resource.id"
      [propertyIri]="propertyDefinition.id"
      [disabled]="dragDropDisabled"
      [showHandle]="canReorder && editModeData.values.length > 1"
      (valuesChange)="editModeData.values = $event">
      <ng-template let-value let-index="index">
        <app-property-value [index]="index" style="width: 100%" />
      </ng-template>
    </app-draggable-value-list>

    @if (userCanAdd && !currentlyAdding && (editModeData.values.length === 0 || matchesCardinality)) {
      <button
        mat-icon-button
        (click)="currentlyAdding = true"
        data-cy="add-property-value-button"
        [matTooltip]="'ui.common.actions.create' | translate">
        <mat-icon class="add-icon">add_box</mat-icon>
      </button>
    }

    @if (currentlyAdding) {
      <app-property-value-add (stopAdding)="currentlyAdding = false" />
    }
  `,
  providers: [PropertyValueService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyValuesComponent implements OnChanges {
  @Input({ required: true }) editModeData!: { resource: ReadResource; values: ReadValue[] };
  @Input({ required: true }) myProperty!: PropertyInfoValues;

  currentlyAdding = false;
  private readonly _resourceFetcherService = inject(ResourceFetcherService);
  readonly propertyValueService = inject(PropertyValueService);

  get userCanAdd() {
    return ResourceUtil.userCanEdit(this.editModeData.resource);
  }

  get canReorder(): boolean {
    return ResourceUtil.userCanEdit(this.editModeData.resource) && !this._resourceFetcherService.resourceVersion;
  }

  get isAnyValueEditing(): boolean {
    return this.propertyValueService.lastOpenedItem$.value !== null;
  }

  get dragDropDisabled(): boolean {
    return !this.canReorder || this.isAnyValueEditing || this.currentlyAdding;
  }

  get matchesCardinality() {
    return [Cardinality._0_n, Cardinality._1_n].includes(this.propertyValueService.cardinality);
  }

  get propertyDefinition() {
    return JsLibPotentialError.setAs(this.myProperty.propDef);
  }

  ngOnChanges() {
    this._setupData();
  }

  private _setupData() {
    this.propertyValueService.editModeData = this.editModeData;
    this.propertyValueService.propertyDefinition = this.propertyDefinition;
    this.propertyValueService.cardinality = this.myProperty.guiDef.cardinality;
  }
}
