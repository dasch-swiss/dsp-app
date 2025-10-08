import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface AddRegionFormDialogProps {
  resourceIri: string;
}

@Component({
  selector: 'app-add-region-form',
  template: `
    <app-dialog-header
      [title]="'resourceEditor.representations.addRegionFormDialog.createAnnotation' | translate"
      [subtitle]="'Add further properties'" />
    <mat-dialog-content>
      <form [formGroup]="regionForm" class="form-content">
        <app-common-input [label]="'Label'" [control]="regionForm.controls.label" />
        <app-ck-editor-control [control]="regionForm.controls.comment" [label]="'Comment'" />
        <app-color-picker [formControl]="regionForm.controls.color"></app-color-picker>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>{{ 'ui.form.action.cancel' | translate }}</button>
      <button
        mat-raised-button
        [mat-dialog-close]="regionForm.value"
        type="button"
        color="primary"
        [disabled]="regionForm.invalid">
        Submit
      </button>
    </mat-dialog-actions>
  `,
  standalone: false,
})
export class AddRegionFormDialogComponent {
  readonly regionForm = this._fb.group({
    color: ['#ff3333', [Validators.required, Validators.pattern('^#[a-f0-9]{6}$')]],
    comment: [null],
    label: [null, Validators.required],
  });

  constructor(
    private _fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public data: AddRegionFormDialogProps
  ) {}
}
