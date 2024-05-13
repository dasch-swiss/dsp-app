import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DeleteValue, KnoraApiConnection, ReadResource, UpdateResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { LoadResourceAction } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { switchMap } from 'rxjs/operators';
import { PropertyValueService } from './property-value.service';

export interface DeleteValueDialogProps {
  index: number;
}

@Component({
  selector: 'app-delete-value-dialog',
  template: `
    <app-dialog-header
      [title]="
        'Are you sure you want to delete this value from ' + propertyValueService.propertyDefinition.label + '?'
      "></app-dialog-header>
    <div mat-dialog-content>
      You can leave a comment to explain your choice.

      <mat-form-field style="display: block; width: 100%; margin-top: 16px">
        <mat-label>Textarea</mat-label>
        <textarea
          matInput
          rows="5"
          placeholder="Please explain the reason for your deletion."
          [(ngModel)]="comment"></textarea>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close (click)="dialogRef.close()">No, keep the value</button>
      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="loading"
        (click)="deleteValue()"
        data-cy="confirm-button">
        Yes, delete the value
      </button>
    </div>
  `,
})
export class DeleteValueDialogComponent implements OnInit {
  loading = false;
  comment: string | undefined;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    @Inject(MAT_DIALOG_DATA)
    public data: DeleteValueDialogProps,
    public dialogRef: MatDialogRef<DeleteValueDialogComponent, boolean>,
    public propertyValueService: PropertyValueService,
    private _store: Store,
    private _cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.dialogRef.updateSize('800px', '');
  }

  deleteValue() {
    const resource = this.propertyValueService._editModeData?.resource as ReadResource;

    const value = this.propertyValueService._editModeData?.values[this.data.index] as unknown as ReadResource;
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
      .pipe(switchMap(() => this._store.dispatch(new LoadResourceAction(resource.id))))
      .subscribe(() => {
        this.dialogRef.close();
        this._cd.detectChanges();
      });
  }
}
