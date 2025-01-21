import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReadUser, UpdateUserRequest } from '@dasch-swiss/dsp-js';
import { UpdateUserAction } from '@dasch-swiss/vre/core/state';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';
import { Actions, Store, ofActionSuccessful } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { UserForm } from '../user-form/user-form.type';

@Component({
  selector: 'app-edit-user-page',
  template: `
    <app-user-form *ngIf="user" [user]="user" (afterFormInit)="form = $event" />

    <div mat-dialog-actions align="end">
      <button color="primary" mat-button mat-dialog-close>{{ 'form.action.cancel' | translate }}</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!form?.valid || (form && form.pristine)"
        (click)="updateUser()">
        {{ 'form.action.update' | translate }}
      </button>
    </div>
  `,
})
export class EditUserPageComponent {
  form: UserForm;

  constructor(
    private _actions$: Actions,
    private _dialogRef: MatDialogRef<EditUserPageComponent>,
    @Inject(MAT_DIALOG_DATA) public user: ReadUser,
    private _notification: NotificationService,
    private _store: Store,
    private _localizationsService: LocalizationService,
    private _translateService: TranslateService
  ) {}

  protected updateUser(): void {
    const userUpdate: UpdateUserRequest = {
      familyName: this.form.controls.familyName.value,
      givenName: this.form.controls.givenName.value,
      lang: this.form.controls.lang.value,
    };
    this._store.dispatch(new UpdateUserAction(this.user.id, userUpdate));
    this._actions$.pipe(ofActionSuccessful(UpdateUserAction), take(1)).subscribe((userAction: UpdateUserAction) => {
      this._localizationsService.setLanguage(userAction.userData.lang);
      this._dialogRef.close();
      this._notification.openSnackBar(this._translateService.instant('form.user.general.updateSuccess'));
    });
  }
}
