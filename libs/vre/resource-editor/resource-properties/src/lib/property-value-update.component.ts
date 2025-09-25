import { Component, Inject, Input } from '@angular/core';
import { KnoraApiConnection, UpdateResource, UpdateValue } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { FormValueGroup } from './form-value-array.type';
import { PropertyValueService } from './property-value.service';
import { propertiesTypeMapping } from './resource-payloads-mapping';

@Component({
  selector: 'app-property-value-update',
  template: ` <app-property-value-edit
    [readValue]="propertyValueService.editModeData.values[index]"
    (afterEdit)="update($event)"
    (afterUndo)="goToDisplayMode()" />`,
  standalone: false,
})
export class PropertyValueUpdateComponent {
  @Input({ required: true }) index!: number;

  constructor(
    public propertyValueService: PropertyValueService,
    private _resourceFetcherService: ResourceFetcherService,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection
  ) {}

  goToDisplayMode() {
    this.propertyValueService.toggleOpenedValue(this.index);
  }

  update(group: FormValueGroup) {
    this._dspApiConnection.v2.values.updateValue(this._getPayload(this.index, group)).subscribe(() => {
      this._resourceFetcherService.reload();
      this.propertyValueService.toggleOpenedValue(this.index);
    });
  }

  private _getPayload(index: number, group: FormValueGroup) {
    const updateResource = new UpdateResource<UpdateValue>();
    const { resource, values } = this.propertyValueService.editModeData;
    updateResource.id = resource.id;
    updateResource.property = values[index].property;
    updateResource.type = resource.type;
    updateResource.value = this._getUpdatedValue(index, group);
    return updateResource;
  }

  private _getUpdatedValue(index: number, group: FormValueGroup) {
    const values = this.propertyValueService.editModeData.values;
    const id = values[index].id;
    const entity = propertiesTypeMapping
      .get(this.propertyValueService.propertyDefinition.objectType!)!
      .updateValue(id, group.controls.item.value, this.propertyValueService.propertyDefinition);
    if (group.controls.comment.value) {
      entity.valueHasComment = group.controls.comment.value;
    }
    return entity;
  }
}
