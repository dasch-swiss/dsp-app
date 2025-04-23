import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReadUser } from '@dasch-swiss/dsp-js';

export interface ManageProjectMembershipDialogProps {
  user: ReadUser;
}

@Component({
  selector: 'app-manage-project-membership-dialog',
  template: ` <app-dialog-header [title]="data.user.username" [subtitle]="'Manage project membership'" />
    <app-membership [user]="data.user" (closeDialog)="dialogRef.close()" />
    <mat-dialog-actions>
      <button mat-button color="primary" matDialogClose>{{ 'ui.form.action.close' | translate }}</button>
    </mat-dialog-actions>`,
})
export class ManageProjectMembershipDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: ManageProjectMembershipDialogProps,
    public dialogRef: MatDialogRef<ManageProjectMembershipDialogComponent, boolean>
  ) {}
}
