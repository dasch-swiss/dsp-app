import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DeleteResource, DeleteResourceResponse, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';

export interface EraseResourceDialogProps {
  resource: DspResource;
  lastModificationDate: string;
}

@Component({
  selector: 'app-erase-resource-dialog',
  template: ` <app-dialog-header
      title="Do you want to erase this resource forever ?"
      [subtitle]="'Erase resource instance'"></app-dialog-header>
    <mat-dialog-content class="form-content">
      <br />WARNING: This action cannot be undone, so use it with care.
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button color="primary" mat-dialog-close class="cancel-button center">No, keep it</button>
      <span class="fill-remaining-space"></span>
      <button mat-button mat-raised-button [color]="'warn'" class="confirm-button center" (click)="submit()">
        Yes, erase
      </button>
    </mat-dialog-actions>`,
})
export class EraseResourceDialogComponent {
  comment: string | undefined;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    @Inject(MAT_DIALOG_DATA)
    public data: EraseResourceDialogProps,
    private _dialogRef: MatDialogRef<EraseResourceDialogComponent>
  ) {}

  submit() {
    const payload = new DeleteResource();
    payload.id = this.data.resource.res.id;
    payload.type = this.data.resource.res.type;
    payload.deleteComment = this.comment ?? '';
    payload.lastModificationDate = this.data.lastModificationDate;

    this._dspApiConnection.v2.res.eraseResource(payload).subscribe(response => {
      this._dialogRef.close(response as DeleteResourceResponse);
    });
  }
}
