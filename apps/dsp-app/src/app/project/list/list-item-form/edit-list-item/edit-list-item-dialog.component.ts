import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StringLiteral } from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/shared/app-api';
import { MultiLanguages } from '@dasch-swiss/vre/shared/app-string-literal';
import { of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { ListItemForm } from '../list-item-form.type';

export interface EditListItemDialogProps {
  nodeIri: string;
  projectIri: string;
  formData: { labels: MultiLanguages; comments: MultiLanguages };
}

@Component({
  selector: 'app-edit-list-item-dialog',
  template: `
    <app-dialog-header [title]="data.formData.labels[0].value" subtitle="Edit child node"></app-dialog-header>

    <div mat-dialog-content>
      <app-reusable-list-item-form
        [formData]="data.formData"
        (afterFormInit)="form = $event"></app-reusable-list-item-form>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>

      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="loading"
        [disabled]="form.invalid"
        (click)="updateChildNode()">
        Submit
      </button>
    </div>
  `,
})
export class EditListItemDialogComponent {
  form: ListItemForm;
  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: EditListItemDialogProps,
    public dialogRef: MatDialogRef<EditListItemDialogComponent, boolean>,
    private _listApiService: ListApiService
  ) {}

  updateChildNode() {
    this.loading = true;

    const payload = {
      projectIri: this.data.projectIri,
      listIri: this.data.nodeIri,
      labels: this.form.getRawValue().labels as StringLiteral[],
      comments: this.form.getRawValue().comments.length > 0 ? (this.form.value.comments as StringLiteral[]) : null, // TODO: improve form to avoir this ?
    };

    this._listApiService
      .updateChildNode(payload.listIri, payload)
      .pipe(
        switchMap(() => {
          // if initial comments Length is not equal to 0 and the comment is now empty, send request to delete comment
          if (this.data.formData.comments.length > 0 && this.form.value.comments.length === 0) {
            return this._listApiService.deleteChildComments(payload.listIri);
          }
          return of(true);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(() => {
        this.dialogRef.close(true);
      });
  }
}
