import { Component, Inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { KnoraApiConnection, ReadProject } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { Store } from '@ngxs/store';
import { finalize, switchMap } from 'rxjs/operators';

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
})
export class EraseProjectDialogComponent {
  eraseForm = new FormGroup({
    shortCode: new FormControl('', [Validators.required, this.projectShortCodeValidator(this.data.project.shortcode)]),
    password: new FormControl('', [Validators.required]),
  });

  isLoading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IEraseProjectDialogProps,
    private _dialogRef: MatDialogRef<EraseProjectDialogComponent>,
    @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
    private _projectApiService: ProjectApiService,
    private _store: Store
  ) {}

  submit() {
    if (this.eraseForm.invalid) return;
    this.isLoading = true;

    const currentUser = this._store.selectSnapshot(state => state.user).user;
    const password = this.eraseForm.controls.password.value;
    const shortCode = this.eraseForm.controls.shortCode.value;

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
