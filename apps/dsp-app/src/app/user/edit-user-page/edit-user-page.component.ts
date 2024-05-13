import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReadUser, UpdateUserRequest } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { UpdateUserAction } from '@dasch-swiss/vre/shared/app-state';
import { Actions, ofActionSuccessful, Store } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { UserForm } from '../user-form/user-form.type';

@Component({
  selector: 'app-edit-user-page',
  templateUrl: './edit-user-page.component.html',
})
export class EditUserPageComponent {
  form: UserForm;

  constructor(
    private _actions$: Actions,
    private _dialogRef: MatDialogRef<EditUserPageComponent>,
    @Inject(MAT_DIALOG_DATA) public user: ReadUser,
    private _notification: NotificationService,
    private _store: Store
  ) {}

  protected updateUser(): void {
    const userUpdate: UpdateUserRequest = {
      familyName: this.form.controls.familyName.value,
      givenName: this.form.controls.givenName.value,
      lang: this.form.controls.lang.value,
    };
    this._store.dispatch(new UpdateUserAction(this.user.id, userUpdate));
    this._actions$.pipe(ofActionSuccessful(UpdateUserAction), take(1)).subscribe(() => {
      this._dialogRef.close();
      this._notification.openSnackBar("You successfully updated the user's profile");
    });
  }
}
