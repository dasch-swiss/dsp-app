import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ListApiService } from '@dasch-swiss/vre/shared/app-api';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { MultiLanguages } from '@dasch-swiss/vre/shared/app-string-literal';

export interface CreateListItemDialogProps {
  nodeIri: string;
  parentIri: string;
  projectIri: string;
  position: number;
}
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-list-item-dialog',
  template: `
    <app-dialog-header title="Insert new child node"></app-dialog-header>

    <div mat-dialog-content>
      <app-reusable-list-item-form
        [formData]="initialFormValue"
        (formValueChange)="form = $event"></app-reusable-list-item-form>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>

      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="loading"
        [disabled]="form.invalid"
        (click)="createChildNode()">
        Submit
      </button>
    </div>
  `,
})
export class CreateListItemDialogComponent {
  form: FormGroup;
  loading = false;
  initialFormValue = { labels: [] as MultiLanguages, comments: [] as MultiLanguages };

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: CreateListItemDialogProps,
    public dialogRef: MatDialogRef<CreateListItemDialogComponent, boolean>,
    private _listApiService: ListApiService
  ) {}

  createChildNode() {
    this.loading = true;

    const payload = {
      parentNodeIri: this.data.parentIri,
      projectIri: this.data.projectIri,
      labels: this.form.value.labels,
      comments: this.form.value.descriptions,
      position: this.data.position,
      name: `${ProjectService.IriToUuid(this.data.projectIri)}-${Math.random().toString(36).substring(2)}${Math.random()
        .toString(36)
        .substring(2)}`,
    };

    this._listApiService.createChildNode(payload.parentNodeIri, payload).subscribe(() => {
      this.loading = false;
      this.dialogRef.close(true);
    });
  }
}
