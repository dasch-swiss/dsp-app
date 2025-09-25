import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StringLiteral } from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { MultiLanguages } from '@dasch-swiss/vre/ui/string-literal';
import { ListItemForm } from '../list-item-form.type';

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
    <app-dialog-header title="Insert new child node" />

    <div mat-dialog-content>
      <app-reusable-list-item-form [formData]="initialFormValue" (afterFormInit)="form = $event" />
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
  standalone: false,
})
export class CreateListItemDialogComponent {
  form: ListItemForm;
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
      labels: this.form.value.labels as StringLiteral[],
      position: this.data.position,
      name: `${ProjectService.IriToUuid(this.data.projectIri)}-${Math.random().toString(36).substring(2)}${Math.random()
        .toString(36)
        .substring(2)}`,
    };

    if (this.form.value.comments && this.form.value.comments.length !== 0) {
      Object.assign(payload, { comments: this.form.value.comments as StringLiteral[] });
    }

    this._listApiService.createChildNode(payload.parentNodeIri, payload).subscribe(() => {
      this.loading = false;
      this.dialogRef.close(true);
    });
  }
}
