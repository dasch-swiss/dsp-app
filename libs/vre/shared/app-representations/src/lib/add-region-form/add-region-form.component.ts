import { Component, Input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-region-form',
  template: `
    <form [formGroup]="regionForm" class="form-content">
      <mat-form-field class="large-field">
        <mat-label>Label</mat-label>
        <input matInput [formControl]="regionForm.controls.label" />
      </mat-form-field>
      <mat-form-field class="large-field">
        <mat-label>Comment</mat-label>
        <textarea matInput rows="7" [formControl]="regionForm.controls.comment"></textarea>
      </mat-form-field>
      <mat-form-field class="large-field without-border color-field">
        <mat-label class="color-label">Color *</mat-label>
        <app-color-picker #colorInput [formControl]="regionForm.controls.color" class="value"></app-color-picker>
      </mat-form-field>
      <mat-form-field class="hidden">
        <mat-label>Is Region Of</mat-label>
        <input matInput disabled [value]="resourceIri" />
      </mat-form-field>
      <!-- Further inputs would be status, lineColor and lineWidth if we want to have these options-->
      <div class="form-action form-panel medium-field">
        <span>
          <button mat-button type="button" mat-dialog-close>{{ 'appLabels.form.action.cancel' | translate }}</button>
        </span>
        <span class="fill-remaining-space"></span>
        <span>
          <button
            mat-raised-button
            [mat-dialog-close]="regionForm.value"
            type="button"
            color="primary"
            [disabled]="!regionForm.valid"
            class="form-submit">
            Submit
          </button>
        </span>
      </div>
    </form>
  `,
  styles: [
    `
      .hidden {
        display: none;
      }

      .form-content {
        margin: 0;

        .form-panel {
          margin-top: 16px;
        }
      }

      ::ng-deep .color-field > .mat-mdc-text-field-wrapper {
        padding-top: 22px;
      }

      .color-field {
        ::ng-deep .mat-mdc-text-field-wrapper {
          overflow: visible;
          z-index: 999;

          .color-label {
            line-height: 48px;
          }

          .mat-mdc-form-field-infix {
            padding-top: 13px;
            min-height: 50px;
          }

          color-picker .open {
            top: -240px !important;
            left: 240px !important;
            position: absolute !important;
          }
        }
      }
    `,
  ],
})
export class AddRegionFormComponent {
  @Input({ required: true }) resourceIri!: string;
  regionForm = this._fb.group({
    color: ['#ff3333', [Validators.required, Validators.pattern('^#[a-f0-9]{6}$')]],
    comment: [null],
    label: [null, Validators.required],
  });

  constructor(private _fb: FormBuilder) {}
}
