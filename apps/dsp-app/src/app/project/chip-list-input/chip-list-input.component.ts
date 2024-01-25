import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, Input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  selector: 'app-chip-list-input',
  template: `
    <mat-form-field style="width: 100%">
      <mat-chip-grid #chipList>
        <mat-chip-row
          *ngFor="let tag of formArray.value; let index = index; trackBy: trackByFn"
          (removed)="removeKeyword(index)">
          {{ tag }}
          <mat-icon matChipRemove>cancel</mat-icon>
        </mat-chip-row>

        <input
          [placeholder]="('appLabels.form.project.general.keywords' | translate) + (chipsRequired ? '' : '*')"
          [matChipInputFor]="chipList"
          [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
          [matChipInputAddOnBlur]="true"
          (matChipInputTokenEnd)="addKeyword($event)" />
      </mat-chip-grid>
    </mat-form-field>
    <mat-error *ngIf="formArray.touched && formArray.errors as errors">{{ errors | humanReadableError }}</mat-error>
    <mat-error *ngIf="addChipFormError">New value: {{ addChipFormError | humanReadableError }}</mat-error>
  `,
})
export class ChipListInputComponent {
  @Input() formGroup: FormGroup;
  @Input() controlName: string;
  @Input() chipsRequired = true;
  @Input() validators: ValidatorFn[];

  separatorKeyCodes = [ENTER, COMMA];
  addChipFormError: ValidationErrors | null = null;

  constructor(private _fb: FormBuilder) {}

  get formArray() {
    return this.formGroup.controls[this.controlName] as FormArray;
  }

  addKeyword(event: MatChipInputEvent): void {
    this.addChipFormError = null;
    const input = event.chipInput.inputElement;
    const value = event.value;

    // add keyword
    const newValue = (value || '').trim();
    if (!newValue) return;

    if (this.formArray.value.includes(newValue)) {
      input.value = '';
      return;
    }

    const newFormControl = this._fb.control(value, this.validators);

    if (newFormControl.valid) {
      this.formArray.push(newFormControl);
      input.value = '';
    } else {
      this.addChipFormError = newFormControl.errors;
    }
  }

  removeKeyword(index: number): void {
    this.formArray.removeAt(index);
  }

  trackByFn = (index: number, item: string) => `${index}-${item}`;
}
