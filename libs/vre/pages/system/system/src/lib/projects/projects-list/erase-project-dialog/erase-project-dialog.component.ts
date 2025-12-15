import { Component, Inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { KnoraApiConnection, ReadProject } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { LoadingButtonDirective } from '@dasch-swiss/vre/ui/progress-indicator';
import { DialogHeaderComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize, switchMap } from 'rxjs';

export interface IEraseProjectDialogProps {
  project: ReadProject;
}

@Component({
  selector: 'app-erase-project-confirmation-dialog',
  styles: [
    `
      mat-form-field {
        width: 100%;
      }
    `,
  ],
  templateUrl: './erase-project-dialog.component.html',
  imports: [
    DialogHeaderComponent,
    LoadingButtonDirective,
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    TranslatePipe,
  ],
})
export class EraseProjectDialogComponent {
  eraseForm = new FormGroup({
    shortCode: new FormControl('', [Validators.required, this.projectShortCodeValidator(this.data.project.shortcode)]),
    password: new FormControl('', [Validators.required]),
  });

  isLoading = false;

  constructor(
    @Inject(DspApiConnectionToken) private readonly _dspApiConnection: KnoraApiConnection,
    @Inject(MAT_DIALOG_DATA) public data: IEraseProjectDialogProps,
    private readonly _dialogRef: MatDialogRef<EraseProjectDialogComponent>,
    private readonly _projectApiService: ProjectApiService,
    private readonly _userService: UserService
  ) {}

  submit() {
    if (this.eraseForm.invalid) return;
    this.isLoading = true;

    const currentUser = this._userService.currentUser;
    const password = this.eraseForm.controls.password.value;
    const shortCode = this.eraseForm.controls.shortCode.value;

    if (!currentUser) {
      return;
    }

    this._dspApiConnection.v2.auth
      .login('username', currentUser.username, password!)
      .pipe(
        switchMap(() => {
          return this._projectApiService.erase(shortCode!);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(response => {
        this._dialogRef.close(response.project);
      });
  }

  private projectShortCodeValidator(shortCode: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null =>
      shortCode.toLowerCase() !== control.value.toLowerCase() ? { shortCode: [control.value] } : null;
  }
}
