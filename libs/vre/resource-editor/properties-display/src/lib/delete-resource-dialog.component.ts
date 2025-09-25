import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DeleteResource, KnoraApiConnection, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';

@Component({
  selector: 'app-delete-resource-dialog',
  template: ` <app-dialog-header title="Do you want to delete this resource ?" [subtitle]="data.label" />
    <mat-dialog-content class="form-content">
      <mat-form-field class="large-field">
        <mat-label>Comment why resource is being deleted</mat-label>
        <textarea
          data-cy="app-delete-resource-dialog-comment"
          matInput
          type="text"
          [(ngModel)]="comment"
          [placeholder]="'Ex. Resource was created by mistake...'"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button color="primary" mat-dialog-close class="cancel-button center">No, keep it</button>
      <span class="fill-remaining-space"></span>
      <button
        data-cy="app-delete-resource-dialog-button"
        mat-button
        mat-raised-button
        [color]="'warn'"
        class="confirm-button center"
        (click)="submit()">
        Yes, delete
      </button>
    </mat-dialog-actions>`,
  standalone: false,
})
export class DeleteResourceDialogComponent {
  comment: string | undefined;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    @Inject(MAT_DIALOG_DATA)
    public data: ReadResource,
    private _dialogRef: MatDialogRef<DeleteResourceDialogComponent>,
    private _resourceFetcherService: ResourceFetcherService
  ) {}

  submit() {
    const payload = new DeleteResource();
    payload.id = this.data.id;
    payload.type = this.data.type;
    payload.deleteComment = this.comment ?? undefined;
    payload.lastModificationDate = this.data.lastModificationDate;
    this._dspApiConnection.v2.res.deleteResource(payload).subscribe(() => {
      this._resourceFetcherService.reload();
      this._dialogRef.close();
    });
  }
}
