import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AdminProjectsLegalInfoApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { finalize } from 'rxjs/operators';

export interface CreateCopyrightHolderDialogProps {
  projectShortcode: string;
}

@Component({
  selector: 'app-add-copyright-holder-dialog',
  template: ` <app-dialog-header title="Add a copyright holder" />

    <app-common-input label="Copyright holder" [control]="form.controls.copyrightHolder" />
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'ui.form.action.cancel' | translate }}</button>
      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="loading"
        [disabled]="form.invalid"
        (click)="onSubmit()">
        {{ 'ui.form.action.submit' | translate }}
      </button>
    </div>`,
})
export class CreateCopyrightHolderDialogComponent {
  form = this._fb.group({
    copyrightHolder: this._fb.control('', Validators.required),
  });

  loading = false;

  constructor(
    private _fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: CreateCopyrightHolderDialogProps,
    private _adminApi: AdminProjectsLegalInfoApiService,
    private _dialogRef: MatDialogRef<CreateCopyrightHolderDialogComponent>
  ) {}

  onSubmit() {
    if (!this.form.controls.copyrightHolder.value) {
      throw new AppError('No copyright holder');
    }
    this.loading = true;

    this._adminApi
      .postAdminProjectsShortcodeProjectshortcodeLegalInfoCopyrightHolders(this.data.projectShortcode, {
        data: [this.form.controls.copyrightHolder.value],
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(() => this._dialogRef.close(true));
  }
}
