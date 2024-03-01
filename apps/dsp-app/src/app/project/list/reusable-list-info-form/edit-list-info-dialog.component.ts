import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ListNodeInfo, StringLiteral, UpdateListInfoRequest } from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/shared/app-api';
import { LoadListsInProjectAction } from '@dasch-swiss/vre/shared/app-state';
import { MultiLanguages } from '@dasch-swiss/vre/shared/app-string-literal';
import { Store } from '@ngxs/store';
import { ListInfoForm } from './list-info-form.type';

export class EditListInfoDialogProps {
  projectIri: string;
  list: ListNodeInfo;
}

@Component({
  selector: 'app-edit-list-info-dialog',
  template: `
    <app-dialog-header title="" subtitle="Edit controlled vocabulary info"></app-dialog-header>
    <div mat-dialog-content>
      <app-reusable-list-info-form [formData]="formData" (afterFormInit)="form = $event"></app-reusable-list-info-form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="loading"
        [disabled]="form?.invalid"
        (click)="submitForm()"
        data-cy="submit-button">
        Update
      </button>
    </div>
  `,
})
export class EditListInfoDialogComponent {
  form: ListInfoForm;
  loading = false;

  formData = { labels: this.data.list.labels as MultiLanguages, comments: this.data.list.comments as MultiLanguages };

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: EditListInfoDialogProps,
    private _dialogRef: MatDialogRef<EditListInfoDialogComponent>,
    private _listApiService: ListApiService,
    private _store: Store
  ) {}

  submitForm() {
    const listInfoUpdateData: UpdateListInfoRequest = new UpdateListInfoRequest();
    listInfoUpdateData.projectIri = this.data.projectIri;
    listInfoUpdateData.listIri = this.data.list.id;
    listInfoUpdateData.labels = this.form.value.labels as StringLiteral[];
    listInfoUpdateData.comments = this.form.value.comments as StringLiteral[];

    this._listApiService.updateInfo(listInfoUpdateData.listIri, listInfoUpdateData).subscribe(response => {
      this._store.dispatch(new LoadListsInProjectAction(this.data.projectIri));
      this.loading = false;
      this._dialogRef.close(true);
    });
  }
}
