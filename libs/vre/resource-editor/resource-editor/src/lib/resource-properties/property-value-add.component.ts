import { Component, EventEmitter, Inject, inject, Output } from '@angular/core';
import { ApiResponseError, CreateValue, KnoraApiConnection, UpdateResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { FormValueGroup } from './form-value-array.type';
import { PropertyValueEditComponent } from './property-value-edit.component';
import { PropertyValueService } from './property-value.service';
import { propertiesTypeMapping } from './resource-payloads-mapping';

@Component({
  selector: 'app-property-value-add',
  imports: [PropertyValueEditComponent],
  template: ` <app-property-value-edit
    [readValue]="undefined"
    (afterEdit)="addItem($event)"
    (afterUndo)="stopAdding.emit()" />`,
  standalone: true,
})
export class PropertyValueAddComponent {
  @Output() stopAdding = new EventEmitter<void>();
  loading = false;

  private readonly _translateService = inject(TranslateService);

  constructor(
    public propertyValueService: PropertyValueService,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _resourceFetcherService: ResourceFetcherService,
    private _notification: NotificationService
  ) {}

  addItem(group: FormValueGroup) {
    this.loading = true;

    const createVal = propertiesTypeMapping
      .get(this.propertyValueService.propertyDefinition.objectType!)!
      .createValue(group.controls.item.value, this.propertyValueService.propertyDefinition);

    if (group.controls.comment.value) {
      createVal.valueHasComment = group.controls.comment.value;
    }

    const resource = this.propertyValueService.editModeData.resource;
    const updateRes = new UpdateResource();
    updateRes.id = resource.id;
    updateRes.type = resource.type;
    updateRes.property = this.propertyValueService.propertyDefinition.id;
    updateRes.value = createVal;

    this._dspApiConnection.v2.values
      .createValue(updateRes as UpdateResource<CreateValue>)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
          this._resourceFetcherService.reload();
          this.stopAdding.emit();
        },
        error: e => {
          if (e instanceof ApiResponseError && e.status === 400) {
            this._notification.openSnackBar(
              this._translateService.instant('resourceEditor.resourceProperties.valueAlreadyExists')
            );
            return;
          }
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
          throw e;
        },
      });
  }
}
