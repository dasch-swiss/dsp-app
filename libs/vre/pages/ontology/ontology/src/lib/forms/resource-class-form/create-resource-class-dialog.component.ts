import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StringLiteralV2 } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DefaultClass } from '@dasch-swiss/vre/shared/app-helper-services';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { ResourceClassForm } from './resource-class-form.type';

@Component({
  selector: 'app-create-resource-class-dialog',
  template: `
    <app-dialog-header [title]="data.label" subtitle="Create resource class" />
    <div mat-dialog-content>
      <app-resource-class-form [formData]="formData" (afterFormInit)="afterFormInit($event)" />
    </div>
    <div mat-dialog-actions align="end">
      <button data-cy="cancel-button" mat-button mat-dialog-close>Cancel</button>
      <button
        data-cy="submit-button"
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="loading"
        [disabled]="form?.invalid"
        (click)="onSubmit()">
        Create
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateResourceClassDialogComponent {
  loading = false;
  form!: ResourceClassForm;
  formData = {
    name: '',
    labels: [],
    comments: [],
  };

  lastModificationDate!: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DefaultClass,
    public dialogRef: MatDialogRef<CreateResourceClassDialogComponent>,
    private _oes: OntologyEditService
  ) {}

  afterFormInit(form: ResourceClassForm) {
    this.form = form;
  }

  onSubmit() {
    this.loading = true;

    this._oes
      .createResourceClass$(
        {
          name: this.form.controls.name.value,
          labels: this.form.controls.labels.value as StringLiteralV2[],
          comments: this.form.controls.comments.value as StringLiteralV2[],
        },
        this.data.iri
      )
      .subscribe(() => {
        this.loading = false;
        this.dialogRef.close();
      });
  }
}
