import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReadUser, User } from '@dasch-swiss/dsp-js';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { CreateUserAction } from '@dasch-swiss/vre/shared/app-state';
import { Actions, ofActionSuccessful, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { UserForm } from '../user-form/user-form.type';

@Component({
  selector: 'app-create-user-dialog',
  template: `
    <app-user-form [user]="user" (afterFormInit)="form = $event" />

    <div mat-dialog-actions align="end">
      <button color="primary" mat-button mat-dialog-close>{{ 'appLabels.form.action.cancel' | translate }}</button>
      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="isLoading$ | async"
        [disabled]="!form?.valid || (isLoading$ | async)"
        (click)="createUser()">
        {{ 'appLabels.form.action.submit' | translate }}
      </button>
    </div>
  `,
})
export class CreateUserDialogComponent {
  user = new ReadUser();
  form: UserForm;

  isLoading$: Observable<boolean>;

  constructor(
    private _actions$: Actions,
    private _notification: NotificationService,
    private _projectService: ProjectService,
    private _store: Store,
    private _dialogRef: MatDialogRef<CreateUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public projectUuId: string
  ) {
    this.isLoading$ = this._store.select(state => state.user.isLoading);
  }

  createUser(): void {
    const user = new User();
    user.familyName = this.form.controls.familyName.value;
    user.givenName = this.form.controls.givenName.value;
    user.email = this.form.controls.email.value;
    user.username = this.form.controls.username.value;
    user.password = this.form.controls.password.value;
    user.lang = this.form.controls.lang.value;
    user.systemAdmin = this.form.controls.systemAdmin.value;
    user.status = true;

    this._store.dispatch(new CreateUserAction(user, this._projectService.uuidToIri(this.projectUuId)));
    this._actions$.pipe(ofActionSuccessful(CreateUserAction), take(1)).subscribe(() => {
      this._dialogRef.close();
      const enrolled = this.projectUuId ? ' and added the user to the project' : '';
      this._notification.openSnackBar(`You have successfully created a user's profile${enrolled}.`);
    });
  }
}
