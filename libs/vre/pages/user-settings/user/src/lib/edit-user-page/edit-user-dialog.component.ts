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
    <app-dialog-header [title]="data.isOwnAccount ? 'Edit my profile' : 'Edit user'" />
    @if (data.user; as user) {
      <app-user-form [data]="user" (afterFormInit)="afterFormInit($event)" />
    }

    <div mat-dialog-actions align="end">
      <button color="primary" mat-button mat-dialog-close>{{ 'ui.form.action.cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="updateUser()">
        {{ 'ui.form.action.update' | translate }}
      </button>
    </div>
  `,
  standalone: false,
})
export class EditUserDialogComponent {
  form!: UserForm;

  constructor(
    private _dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditUserDialogProps,
    private _notification: NotificationService,
    private _userService: UserService,
    private _localizationsService: LocalizationService,
    private _translateService: TranslateService,
    private _userApiService: UserApiService
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
