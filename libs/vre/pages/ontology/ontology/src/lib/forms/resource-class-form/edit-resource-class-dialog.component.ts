import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StringLiteralV2 } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DefaultClass, OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { MultiLanguages } from '@dasch-swiss/vre/ui/string-literal';
import { take } from 'rxjs/operators';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { UpdateResourceClassData, ResourceClassForm, ResourceClassFormData } from './resource-class-form.type';

@Component({
  selector: 'app-edit-resource-class-dialog',
  template: `
    <app-dialog-header [title]="''" subtitle="Customize resource class" />
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
        Update
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditResourceClassDialogComponent implements OnInit {
  loading = false;
  form: ResourceClassForm | undefined;
  formData!: ResourceClassFormData;
  lastModificationDate!: string;

  isUpdateResourceClassData(data: UpdateResourceClassData | DefaultClass): data is UpdateResourceClassData {
    return 'id' in data;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: UpdateResourceClassData | DefaultClass,
    public dialogRef: MatDialogRef<EditResourceClassDialogComponent, ResourceClassFormData | UpdateResourceClassData>,
    private _ontologyService: OntologyService,
    private _oes: OntologyEditService
  ) {}

  ngOnInit() {
    this.dialogRef.updateSize('800px', '');
    if (this.isUpdateResourceClassData(this.data)) {
      this.formData = {
        name: this._ontologyService.getNameFromIri(this.data.id),
        labels: this.data.labels ? (this.data.labels as MultiLanguages) : [],
        comments: this.data.comments ? (this.data.comments as MultiLanguages) : [],
      };
    } else {
      this.formData = {
        name: '',
        labels: [],
        comments: [],
      };
    }
  }

  afterFormInit(form: ResourceClassForm) {
    this.form = form;
    if (this.isUpdateResourceClassData(this.data)) {
      this.form.controls.name.disable();
    }
  }

  onSubmit() {
    this.loading = true;
    const labels = this.form?.controls.labels.touched
      ? (this.form?.controls.labels.value as StringLiteralV2[])
      : undefined; // by leaving the labels undefined if not touched, they are not updated unnecessarily by the ontology service
    const comments = this.form?.controls.comments.touched
      ? (this.form?.controls.comments.value as StringLiteralV2[])
      : undefined; // by leaving the comments undefined if not touched, they are not updated unnecessarily by the ontology service

    if (this.isUpdateResourceClassData(this.data)) {
      const upd = { id: this.data.id, labels, comments } as UpdateResourceClassData;
      this._oes
        .updateResourceClass$(upd)
        .pipe(take(1))
        .subscribe(res => {
          this.loading = false;
          this.dialogRef.close();
        });
    } else {
      const createData = {
        name: this.form?.controls.name.value,
        labels,
        comments,
      } as unknown as ResourceClassFormData;
      this._oes
        .createResourceClass$(createData)
        .pipe(take(1))
        .subscribe(res => {
          this.loading = false;
          this.dialogRef.close();
        });
    }
  }
}
