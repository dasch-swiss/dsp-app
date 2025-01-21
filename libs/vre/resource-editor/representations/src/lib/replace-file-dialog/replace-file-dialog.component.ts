import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UpdateFileValue } from '@dasch-swiss/dsp-js/src/models/v2/resources/values/update/update-file-value';
import { FileRepresentationType } from '../file-representation.type';

export interface ReplaceFileDialogProps {
  representation: FileRepresentationType;
  propId: string;
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-replace-file-dialog',
  template: `
    <app-dialog-header [title]="data.title" [subtitle]="data.subtitle" />
    <mat-dialog-content>
      <div class="warning">
        <div class="container">
          <div class="icon">
            <mat-icon>warning</mat-icon>
          </div>
          <div class="message">{{ data.title }} will be replaced.</div>
        </div>
      </div>

      <app-upload-control [representation]="data.representation" [formControl]="form" [resourceId]="data.propId" />
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" data-cy="replace-file-cancel-button" (click)="dialogRef.close()">
        {{ 'form.action.cancel' | translate }}
      </button>
      <button
        mat-raised-button
        type="submit"
        data-cy="replace-file-submit-button"
        [disabled]="form.invalid"
        [color]="'primary'"
        (click)="saveFile()">
        {{ 'form.action.submit' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styleUrls: ['./replace-file-dialog.component.scss'],
})
export class ReplaceFileDialogComponent {
  form = this._fb.control<UpdateFileValue | null>(null, [Validators.required]);

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: ReplaceFileDialogProps,
    public dialogRef: MatDialogRef<ReplaceFileDialogComponent>,
    private _fb: FormBuilder
  ) {}

  saveFile() {
    this.dialogRef.close(this.form.getRawValue());
  }
}
