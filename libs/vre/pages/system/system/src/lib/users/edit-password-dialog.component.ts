import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReadUser } from '@dasch-swiss/dsp-js';

export interface EditPasswordDialogProps {
  user: ReadUser;
}

@Component({
  selector: 'app-edit-password-dialog',
  template: ` <app-dialog-header
      [title]="data.user.username"
      [subtitle]="'pages.system.users.changePassword' | translate" />
    <app-password-form [user]="data.user" (closeDialog)="dialogRef.close()" />`,
})
export class EditPasswordDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditPasswordDialogProps,
    public dialogRef: MatDialogRef<EditPasswordDialogComponent>
  ) {}
}
