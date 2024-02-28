import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CreateResourceClass, KnoraApiConnection, UpdateOntology } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { tap } from 'rxjs/operators';

export interface CreateResourceClassDialogProps {
  id: string;
  title: string;
  ontologyId: string;
  lastModificationDate: string;
}

@Component({
  selector: 'app-create-resource-class-dialog',
  template: `
    <app-dialog-header [title]="data.title" subtitle="Customize resource class"></app-dialog-header>
    <div mat-dialog-content>
      <app-resource-class-form
        [formData]="{ name: '', labels: [], comments: [] }"
        (formValueChange)="form = $event"></app-resource-class-form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close data-cy="cancel-button" (click)="onCancel()">Cancel</button>
      <button
        data-cy="submit-button"
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="loading"
        [disabled]="form.invalid"
        (click)="onSubmit()">
        Submit
      </button>
    </div>
  `,
})
export class CreateResourceClassDialogComponent implements OnInit {
  loading = false;
  form: FormGroup;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    @Inject(MAT_DIALOG_DATA)
    public data: CreateResourceClassDialogProps,
    public dialogRef: MatDialogRef<CreateResourceClassDialogComponent, boolean>
  ) {}

  ngOnInit() {
    this.dialogRef.updateSize('800px', '');
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  onSubmit() {
    this.loading = true;

    this._dspApiConnection.v2.onto
      .createResourceClass(this._createOntology())
      .pipe(
        tap(
          () => {
            this.loading = false;
            this.dialogRef.close();
          },
          () => {
            this.loading = false;
          }
        )
      )
      .subscribe();
  }

  private _createOntology() {
    const onto = new UpdateOntology<CreateResourceClass>();

    onto.id = this.data.ontologyId;
    onto.lastModificationDate = this.data.lastModificationDate;

    const newResClass = new CreateResourceClass();

    newResClass.name = this.form.value.name;
    newResClass.label = this.form.value.labels;
    newResClass.comment = this.form.value.comments;
    newResClass.subClassOf = [this.data.id];

    onto.entity = newResClass;
    return onto;
  }
}
