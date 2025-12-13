import { Component, Inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { DialogHeaderComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule } from '@ngx-translate/core';
import { MembershipComponent } from '../membership/membership.component';

export interface ManageProjectMembershipDialogProps {
  user: ReadUser;
}

@Component({
  selector: 'app-manage-project-membership-dialog',
  template: ` <app-dialog-header [title]="data.user.username" [subtitle]="'Manage project membership'" />
    <div mat-dialog-content>
      <app-membership [userId]="data.user.id" (closeDialog)="dialogRef.close()" />
    </div>
    <mat-dialog-actions>
      <button mat-button color="primary" matDialogClose>{{ 'ui.common.actions.close' | translate }}</button>
    </mat-dialog-actions>`,
  imports: [
    DialogHeaderComponent,
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MembershipComponent,
    TranslateModule,
  ],
})
export class ManageProjectMembershipDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: ManageProjectMembershipDialogProps,
    public readonly dialogRef: MatDialogRef<ManageProjectMembershipDialogComponent, boolean>
  ) {}
}
