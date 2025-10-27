import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReadUser, UpdateUserRequest } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { UserService } from '@dasch-swiss/vre/core/session';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';
import { UserForm } from '../user-form/user-form.type';

export interface EditUserDialogProps {
  user: ReadUser;
  isOwnAccount: boolean;
}

@Component({
  selector: 'app-edit-user-dialog',
  template: `
    <app-dialog-header
      [title]="
        data.isOwnAccount
          ? ('pages.userSettings.editUserDialog.editMyProfile' | translate)
          : ('pages.userSettings.editUserDialog.editUser' | translate)
      " />
    @if (data.user; as user) {
      <div mat-dialog-content>
        <app-user-form [data]="user" (afterFormInit)="afterFormInit($event)" />
      </div>
    }

    <div mat-dialog-actions align="end">
      <button color="primary" mat-button mat-dialog-close>{{ 'ui.common.actions.cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="updateUser()">
        {{ 'ui.common.actions.update' | translate }}
      </button>
    </div>
  `,
  standalone: false,
})
export class EditUserDialogComponent {
  form!: UserForm;

  constructor(
    private readonly _dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: EditUserDialogProps,
    private readonly _notification: NotificationService,
    private readonly _userService: UserService,
    private readonly _localizationsService: LocalizationService,
    private readonly _translateService: TranslateService,
    private readonly _userApiService: UserApiService
  ) {}

  afterFormInit(form: UserForm) {
    this.form = form;
    this.form.controls.username.disable();
    this.form.controls.email.disable();
  }

  protected updateUser(): void {
    const userUpdate: UpdateUserRequest = {
      familyName: this.form.controls.familyName.value,
      givenName: this.form.controls.givenName.value,
      lang: this.form.controls.lang.value,
    };

    this._userApiService.updateBasicInformation(this.data.user.id, userUpdate).subscribe(() => {
      this._dialogRef.close(true);
      this._notification.openSnackBar(this._translateService.instant('pages.userSettings.userForm.updateSuccess'));
      if (userUpdate.lang !== undefined && this.data.user.username === this._userService.currentUser?.username) {
        this._localizationsService.setLanguage(userUpdate.lang);
        document.location.reload();
      }
    });
  }
}
