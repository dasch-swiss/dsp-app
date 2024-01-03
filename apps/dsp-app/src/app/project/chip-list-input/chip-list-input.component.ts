import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  selector: 'app-chip-list-input',
  template: `
    <mat-form-field style="width: 100%">
      <mat-chip-grid #chipList>
        <mat-chip-row *ngFor="let tag of keywords; trackBy: trackByFn" (removed)="removeKeyword(tag)">
          {{ tag }}
          <mat-icon matChipRemove *ngIf="editable">cancel</mat-icon>
        </mat-chip-row>

        <input
          [placeholder]="('appLabels.form.project.general.keywords' | translate) + (chipsRequired ? '' : '*')"
          [matChipInputFor]="chipList"
          [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
          [matChipInputAddOnBlur]="true"
          (matChipInputTokenEnd)="addKeyword($event)" />
      </mat-chip-grid>
    </mat-form-field>
    <mat-error *ngIf="formControl.errors as errors">{{ errors | humanReadableError }}</mat-error>
  `,
})
export class ChipListInputComponent {
  @Input() formGroup: FormGroup;
  @Input() controlName: string;
  @Input() keywords: string[];
  @Input() editable = true;
  @Input() chipsRequired = true;

  separatorKeyCodes = [ENTER, COMMA];

  get formControl() {
    return this.formGroup.controls[this.controlName] as FormControl;
  }

  update() {
    this.formControl.setValue(this.keywords);
    this.formControl.markAsTouched();
  }

  addKeyword(event: MatChipInputEvent): void {
    const input = event.chipInput.inputElement;
    const value = event.value;

    if (!this.keywords) {
      this.keywords = [];
    }

    // add keyword
    if ((value || '').trim()) {
      this.keywords.push(value.trim());
    }

    // reset the input value
    if (input) {
      input.value = '';
    }

    this.update();
  }

  removeKeyword(keyword: any): void {
    const index = this.keywords.indexOf(keyword);

    if (index >= 0) {
      this.keywords.splice(index, 1);
    }
    this.update();
  }

  trackByFn = (index: number, item: string) => `${index}-${item}`;
}
