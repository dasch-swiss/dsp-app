import { ChangeDetectorRef, Component, Inject, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { DeleteValue, KnoraApiConnection, ReadResource, UpdateResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { LoadingButtonDirective } from '@dasch-swiss/vre/ui/progress-indicator';
import { DialogHeaderComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { tap } from 'rxjs';
import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { PropertyValueService } from './property-value.service';

export interface DeleteValueDialogProps {
  index: number;
}

@Component({
  selector: 'app-delete-value-dialog',
  imports: [
    DialogHeaderComponent,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatFormField,
    MatLabel,
    MatInput,
    MatButton,
    FormsModule,
    LoadingButtonDirective,
    TranslatePipe,
  ],
  template: `
    <app-dialog-header
      [title]="
        _translateService.instant('resourceEditor.resourceProperties.deleteValue.title', {
          label: propertyValueService.propertyDefinition.label,
        })
      " />
    <div mat-dialog-content>
      {{ 'resourceEditor.resourceProperties.deleteValue.explanation' | translate }}

      <mat-form-field style="display: block; width: 100%; margin-top: 16px">
        <mat-label>{{ 'resourceEditor.resourceProperties.deleteValue.reason' | translate }}</mat-label>
        <textarea
          matInput
          data-cy="delete-comment"
          rows="5"
          [placeholder]="'resourceEditor.resourceProperties.deleteValue.reasonPlaceholder' | translate"
          [(ngModel)]="comment"></textarea>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close (click)="dialogRef.close()">
        {{ 'resourceEditor.resourceProperties.deleteValue.noKeep' | translate }}
      </button>
      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="loading"
        (click)="deleteValue()"
        data-cy="confirm-button">
        {{ 'resourceEditor.resourceProperties.deleteValue.yesDelete' | translate }}
      </button>
    </div>
  `,
})
export class DeleteValueDialogComponent {
  loading = false;
  comment: string | undefined;

  readonly _translateService = inject(TranslateService);

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    @Inject(MAT_DIALOG_DATA)
    public data: DeleteValueDialogProps,
    public dialogRef: MatDialogRef<DeleteValueDialogComponent, boolean>,
    public propertyValueService: PropertyValueService,
    private _resourceFetcherService: ResourceFetcherService,
    private _cd: ChangeDetectorRef
  ) {}

  deleteValue() {
    const resource = this.propertyValueService.editModeData.resource as ReadResource;

    const value = this.propertyValueService.editModeData.values[this.data.index] as unknown as ReadResource;
    const deleteVal = new DeleteValue();
    deleteVal.id = value.id;
    deleteVal.type = value.type;
    deleteVal.deleteComment = this.comment;

    const updateRes = new UpdateResource();
    updateRes.type = resource.type;
    updateRes.id = resource.id;
    updateRes.property = this.propertyValueService.propertyDefinition.id;
    updateRes.value = deleteVal;

    this._dspApiConnection.v2.values
      .deleteValue(updateRes as UpdateResource<DeleteValue>)
      .pipe(tap(() => this._resourceFetcherService.reload()))
      .subscribe(() => {
        this.dialogRef.close();
        this._cd.detectChanges();
      });
  }
}
