import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OntologyMetadata } from '@dasch-swiss/dsp-js';
import { finalize } from 'rxjs';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { OntologyForm, UpdateOntologyData } from './ontology-form.type';

@Component({
  selector: 'app-edit-ontology-form-dialog',
  template: ` <app-dialog-header [title]="data.id" [subtitle]="'pages.ontology.ontologyForm.edit' | translate" />

    <div mat-dialog-content>
      <app-ontology-form [data]="data" [mode]="'edit'" (afterFormInit)="afterFormInit($event)" />
    </div>

    <div mat-dialog-actions align="end">
      <button color="primary" mat-button mat-dialog-close>{{ 'ui.common.actions.cancel' | translate }}</button>
      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="loading"
        data-cy="submit-button"
        (click)="onSubmit()">
        {{ 'ui.common.actions.submit' | translate }}
      </button>
    </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EditOntologyFormDialogComponent {
  loading = false;

  form!: OntologyForm;

  constructor(
    private readonly _oes: OntologyEditService,
    @Inject(MAT_DIALOG_DATA) public readonly data: UpdateOntologyData,
    public readonly dialogRef: MatDialogRef<EditOntologyFormDialogComponent, OntologyMetadata>
  ) {}

  afterFormInit(form: OntologyForm) {
    this.form = form;
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;

    this._oes
      .updateOntology$({
        id: this.data.id,
        label: this.form.controls.label.value,
        comment: this.form.controls.comment.value,
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(ontology => {
        this.dialogRef.close(ontology);
      });
  }
}
