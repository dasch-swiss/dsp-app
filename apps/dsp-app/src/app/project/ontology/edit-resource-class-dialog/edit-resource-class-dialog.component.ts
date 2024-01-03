import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  DeleteResourceClassComment,
  KnoraApiConnection,
  ResourceClassDefinitionWithAllLanguages,
  UpdateOntology,
  UpdateResourceClassComment,
  UpdateResourceClassLabel,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { finalize, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-edit-resource-class-dialog',
  template: `
    <app-dialog-header [title]="data.title" subtitle="Customize resource class"></app-dialog-header>
    <div mat-dialog-content>
      <app-resource-class-form
        [formData]="{ name: '', labels: [], comments: [] }"
        (formValueChange)="form = $event"></app-resource-class-form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="loading"
        [disabled]="form.invalid"
        (click)="onSubmit()">
        Update
      </button>
    </div>
  `,
})
export class EditResourceClassDialogComponent implements OnInit {
  loading = false;
  form: FormGroup;
  lastModificationDate: string;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    @Inject(MAT_DIALOG_DATA)
    public data: { id: string; title: string; ontologyId: string; lastModificationDate: string },
    public dialogRef: MatDialogRef<EditResourceClassDialogComponent>
  ) {}

  ngOnInit() {
    this.dialogRef.updateSize('800px', ''); // Set your desired width
    this.lastModificationDate = this.data.lastModificationDate;
  }

  onSubmit() {
    this.loading = true;

    // label
    const onto4Label = new UpdateOntology<UpdateResourceClassLabel>();
    onto4Label.id = this.data.ontologyId;
    onto4Label.lastModificationDate = this.lastModificationDate;

    const updateLabel = new UpdateResourceClassLabel();
    updateLabel.id = this.data.id;
    updateLabel.labels = this.form.value.labels;
    onto4Label.entity = updateLabel;

    // comment
    const onto4Comment = new UpdateOntology<UpdateResourceClassComment>();
    onto4Comment.id = this.data.ontologyId;

    const updateComment = new UpdateResourceClassComment();
    updateComment.id = this.data.id;
    updateComment.comments = this.form.value.comments;
    onto4Comment.entity = updateComment;

    this._dspApiConnection.v2.onto
      .updateResourceClass(onto4Label)
      .pipe(
        switchMap((classLabelResponse: ResourceClassDefinitionWithAllLanguages) => {
          this.lastModificationDate = classLabelResponse.lastModificationDate;
          onto4Comment.lastModificationDate = this.lastModificationDate;

          if (updateComment.comments.length) {
            return this._updateComment$(onto4Comment);
          } else {
            return this._deleteResourceComment$();
          }
        }),
        tap(() => {
          this.loading = false;
        })
      )
      .subscribe();
  }

  private _deleteResourceComment$() {
    const deleteResourceClassComment = new DeleteResourceClassComment();
    deleteResourceClassComment.id = this.data.id;
    deleteResourceClassComment.lastModificationDate = this.lastModificationDate;

    return this._dspApiConnection.v2.onto.deleteResourceClassComment(deleteResourceClassComment).pipe(
      tap((deleteCommentResponse: ResourceClassDefinitionWithAllLanguages) => {
        this.lastModificationDate = deleteCommentResponse.lastModificationDate;
      })
    );
  }

  private _updateComment$(onto4Comment) {
    return this._dspApiConnection.v2.onto.updateResourceClass(onto4Comment).pipe(
      tap((classCommentResponse: ResourceClassDefinitionWithAllLanguages) => {
        this.lastModificationDate = classCommentResponse.lastModificationDate;
      })
    );
  }
}
