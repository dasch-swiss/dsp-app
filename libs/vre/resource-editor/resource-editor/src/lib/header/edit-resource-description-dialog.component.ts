import { AsyncPipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  Constants,
  CreateValue,
  DeleteValue,
  KnoraApiConnection,
  ReadResource,
  ReadTextValue,
  ResourcePropertyDefinition,
  UpdateResource,
  UpdateValue,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { LoadingButtonDirective } from '@dasch-swiss/vre/ui/progress-indicator';
import { CkEditorComponent, DialogHeaderComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize, Observable } from 'rxjs';
import { propertiesTypeMapping } from '../properties/properties-display/property-value/resource-payloads-mapping';
import { ResourceFetcherService } from '../representation/resource-fetcher.service';

export interface EditResourceDescriptionDialogData {
  resource: ReadResource;
  /** The description the header shows, i.e. the first `hasDescription` value; absent when there is none. */
  value?: ReadTextValue;
}

/**
 * True when nothing but empty paragraphs, line breaks, non-breaking spaces and whitespace is left.
 * Any other tag counts as content, so a description that is only an image or a table is kept.
 */
export function isRichTextEmpty(html: string | null | undefined): boolean {
  return (html ?? '').replace(/<\/?p>|<br\s*\/?>|&nbsp;|\u00a0|\s/g, '') === '';
}

@Component({
  selector: 'app-edit-resource-description-dialog',
  imports: [
    AsyncPipe,
    CkEditorComponent,
    DialogHeaderComponent,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    LoadingButtonDirective,
    TranslatePipe,
  ],
  template: ` <app-dialog-header
      [title]="data.resource.label"
      [subtitle]="'resourceEditor.resourceProperties.editDescription.subtitle' | translate" />

    <div mat-dialog-content>
      <app-ck-editor
        [control]="control"
        [projectShortcode]="(resourceFetcherService.projectShortcode$ | async) ?? undefined" />
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'ui.common.actions.cancel' | translate }}</button>
      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        data-cy="edit-resource-description-submit"
        [isLoading]="loading"
        (click)="submit()">
        {{ 'ui.common.actions.submit' | translate }}
      </button>
    </div>`,
})
export class EditResourceDescriptionDialogComponent {
  private readonly _mapping = propertiesTypeMapping.get(Constants.TextValue)!;

  control = this._mapping.control(this.data.value) as FormControl<string | null>;
  private readonly _initialValue = this.control.value;
  loading = false;

  constructor(
    @Inject(DspApiConnectionToken)
    private readonly _dspApiConnection: KnoraApiConnection,
    @Inject(MAT_DIALOG_DATA) public readonly data: EditResourceDescriptionDialogData,
    private readonly _dialogRef: MatDialogRef<EditResourceDescriptionDialogComponent, boolean>,
    public readonly resourceFetcherService: ResourceFetcherService
  ) {}

  submit() {
    const request$ = this._request$(this.control.value);
    if (!request$) {
      this._dialogRef.close(false);
      return;
    }

    this.loading = true;
    request$
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(() => {
        this.resourceFetcherService.reload();
        this._dialogRef.close(true);
      });
  }

  /** `null` when there is nothing to send: the content is unchanged, or empty with no value to delete. */
  private _request$(content: string | null): Observable<unknown> | null {
    const existing = this.data.value;
    if (content === this._initialValue) return null;

    if (isRichTextEmpty(content)) {
      if (!existing) return null;
      const deleteValue = new DeleteValue();
      deleteValue.id = existing.id;
      deleteValue.type = existing.type;
      return this._dspApiConnection.v2.values.deleteValue(this._payload(deleteValue));
    }

    if (existing) {
      const updateValue = this._mapping.updateValue(existing.id, content, this._propertyDefinition);
      return this._dspApiConnection.v2.values.updateValue(this._payload<UpdateValue>(updateValue));
    }

    const createValue = this._mapping.createValue(content, this._propertyDefinition);
    return this._dspApiConnection.v2.values.createValue(this._payload<CreateValue>(createValue));
  }

  private get _propertyDefinition(): ResourcePropertyDefinition {
    return this.data.resource.entityInfo.properties[Constants.HasDescription] as ResourcePropertyDefinition;
  }

  private _payload<T extends CreateValue | UpdateValue | DeleteValue>(value: T): UpdateResource<T> {
    const payload = new UpdateResource<T>();
    payload.id = this.data.resource.id;
    payload.type = this.data.resource.type;
    payload.property = Constants.HasDescription;
    payload.value = value;
    return payload;
  }
}
