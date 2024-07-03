import { Component, Inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { KnoraApiConnection, ProjectResponse, ReadProject } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/shared/app-api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { Store } from '@ngxs/store';
import { of } from 'rxjs';
import { catchError, filter, finalize, switchMap } from 'rxjs/operators';

export interface IEraseProjectDialogProps {
  project: ReadProject;
}

/**
 * validation of existing project short code
 *
 * @param {string} shortCode Project short code
 * @returns ValidatorFn
 */
function projectShortCodeValidator(shortCode: string): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } =>
    shortCode !== control.value.toLowerCase() ? { shortCode: [control.value] } : null;
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
})
export class EraseProjectDialogComponent {
  eraseForm = new FormGroup({
    shortCode: new FormControl('', [Validators.required, projectShortCodeValidator(this.data.project.shortcode)]),
    password: new FormControl('', [Validators.required]),
  });
  isLoading = false;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    @Inject(MAT_DIALOG_DATA)
    public data: IEraseProjectDialogProps,
    private _dialogRef: MatDialogRef<EraseProjectDialogComponent>,
    private _projectApiService: ProjectApiService,
    private _store: Store
  ) {}

  submit() {
    if (this.eraseForm.invalid) return;
    this.isLoading = true;

    const currentUser = this._store.selectSnapshot(state => state.user).user;
    return this._dspApiConnection.v2.auth
      .login('username', currentUser.username, this.eraseForm.controls.password.value) // TODO [BE] should be dedicated endpoint
      .pipe(catchError(() => of(false)))
      .pipe(
        switchMap((result: boolean) => {
          if (!result) {
            this.eraseForm.controls.password.setErrors({ password: [] });
            return of(null);
          }

          return this._projectApiService.erase(this.eraseForm.controls.shortCode.value);
        })
      )
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        filter(result => !!result)
      )
      .subscribe((response: ProjectResponse) => {
        this._dialogRef.close(response.project);
      });
  }
}
