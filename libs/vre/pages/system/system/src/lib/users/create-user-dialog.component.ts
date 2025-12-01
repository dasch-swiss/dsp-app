import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { User } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { PasswordConfirmFormComponent, UserForm, UserFormComponent } from '@dasch-swiss/vre/shared/app-common-to-move';
import { LoadingButtonDirective } from '@dasch-swiss/vre/ui/progress-indicator';
import { DialogHeaderComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-create-user-dialog',
  template: `
    <app-dialog-header [title]="'pages.system.createUserDialog.title' | translate" />
    <div mat-dialog-content>
      <app-user-form [data]="data" (afterFormInit)="afterUserFormInit($event)" />
      <app-password-confirm-form (afterFormInit)="afterPasswordFormInit($event)" />
      <mat-slide-toggle [formControl]="form.controls.isSystemAdmin">{{
        'pages.system.createUserDialog.isSystemAdmin' | translate
      }}</mat-slide-toggle>
    </div>

    <div mat-dialog-actions align="end">
      <button color="primary" mat-button mat-dialog-close>{{ 'ui.common.actions.cancel' | translate }}</button>
      <button mat-raised-button color="primary" appLoadingButton [isLoading]="isLoading" (click)="createUser()">
        {{ 'ui.common.actions.submit' | translate }}
      </button>
    </div>
  `,
  standalone: true,
  imports: [
    DialogHeaderComponent,
    LoadingButtonDirective,
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatSlideToggle,
    PasswordConfirmFormComponent,
    ReactiveFormsModule,
    TranslateModule,
    UserFormComponent,
  ],
})
export class CreateUserDialogComponent implements OnInit {
  form = this._fb.group(
    {} as {
      user: UserForm;
      passwordForm: FormGroup;
      isSystemAdmin: FormControl<boolean>;
    }
  );
  isLoading = false;

  readonly data = { givenName: '', familyName: '', email: '', username: '', lang: 'en', isSystemAdmin: false };

  constructor(
    private readonly _dialogRef: MatDialogRef<CreateUserDialogComponent>,
    private readonly _userApiService: UserApiService,
    private readonly _fb: FormBuilder
  ) {}

  ngOnInit() {
    this.form.addControl('isSystemAdmin', this._fb.control(false, { nonNullable: true }));
  }

  afterUserFormInit(form: UserForm): void {
    this.form.addControl('user', form);
  }

  afterPasswordFormInit(form: FormGroup): void {
    this.form.addControl('passwordForm', form);
  }

  createUser(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) {
      return;
    }
    this.isLoading = true;

    const userFormControls = this.form.controls.user.controls;

    const user = new User();
    user.familyName = userFormControls.familyName.value;
    user.givenName = userFormControls.givenName.value;
    user.email = userFormControls.email.value;
    user.username = userFormControls.username.value;
    user.password = this.form.controls.passwordForm.get('password')?.value;
    user.lang = userFormControls.lang.value;
    user.systemAdmin = this.form.controls.isSystemAdmin.value;
    user.status = true;

    this._userApiService
      .create(user)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(response => {
        this._dialogRef.close(response.user.id);
      });
  }
}
