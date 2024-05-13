import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DeleteResource, DeleteResourceResponse, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';

export interface DeleteResourceDialogProps {
  resource: DspResource;
  lastModificationDate: string;
}

@Component({
  selector: 'app-delete-resource-dialog',
  template: ` <app-dialog-header
      title="Do you want to delete this resource ?"
      [subtitle]="data.resource.res.label"></app-dialog-header>
    <mat-dialog-content class="form-content">
      <mat-form-field class="large-field">
        <mat-label>Comment why resource is being deleted</mat-label>
        <textarea
          matInput
          class="deletion-comment"
          type="text"
          [(ngModel)]="comment"
          [placeholder]="'Ex. Resource was created by mistake...'"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button color="primary" mat-dialog-close class="cancel-button center">No, keep it</button>
      <span class="fill-remaining-space"></span>
      <button mat-button mat-raised-button [color]="'warn'" class="confirm-button center" (click)="submit()">
        Yes, delete
      </button>
    </mat-dialog-actions>`,
})
export class DeleteResourceDialogComponent {
  comment: string | undefined;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    @Inject(MAT_DIALOG_DATA)
    public data: DeleteResourceDialogProps,
    private _dialogRef: MatDialogRef<DeleteResourceDialogComponent>
  ) {}

  submit() {
    const payload = new DeleteResource();
    payload.id = this.data.resource.res.id;
    payload.type = this.data.resource.res.type;
    payload.deleteComment = this.comment ?? undefined;
    payload.lastModificationDate = this.data.lastModificationDate;
    this._dspApiConnection.v2.res.deleteResource(payload).subscribe(response => {
      this._dialogRef.close(response as DeleteResourceResponse);
    });
  }
}
