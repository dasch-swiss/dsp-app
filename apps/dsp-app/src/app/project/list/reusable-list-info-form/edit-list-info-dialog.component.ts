import { Component, Inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ListNodeInfo, StringLiteral, UpdateListInfoRequest } from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/shared/app-api';
import { LoadListsInProjectAction } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';

@Component({
  selector: 'app-edit-list-info-dialog',
  template: `
    <app-dialog-header title="" subtitle="Edit controlled vocabulary info"></app-dialog-header>
    <div mat-dialog-content>
      <app-reusable-list-info-form
        [formData]="{ labels: data.list.labels, comments: data.list.comments }"
        (formValueChange)="form = $event"></app-reusable-list-info-form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="loading"
        [disabled]="form?.invalid"
        (click)="submitForm()">
        Update
      </button>
    </div>
  `,
})
export class EditListInfoDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { projectIri: string; list: ListNodeInfo },
    public dialogRef: MatDialogRef<EditListInfoDialogComponent>,
    private _listApiService: ListApiService,
    private _store: Store
  ) {}

  submitForm() {
    const listInfoUpdateData: UpdateListInfoRequest = new UpdateListInfoRequest();
    listInfoUpdateData.projectIri = this.data.projectIri;
    listInfoUpdateData.listIri = this.data.list.id;
    listInfoUpdateData.labels = this.form.value.labels;
    listInfoUpdateData.comments = this.form.value.comments;

    this._listApiService.updateInfo(listInfoUpdateData.listIri, listInfoUpdateData).subscribe(response => {
      this._store.dispatch(new LoadListsInProjectAction(this.data.projectIri));
      this.loading = false;
    });
  }
}
