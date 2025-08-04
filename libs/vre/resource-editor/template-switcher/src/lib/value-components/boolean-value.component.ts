import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-boolean-value',
  template: `
    <app-nullable-editor [formControl]="control" [defaultValue]="false">
      <mat-slide-toggle
        [formControl]="control"
        data-cy="bool-toggle"
        *ngIf="control.value !== null"
        style="padding: 16px" />
    </app-nullable-editor>
    <mat-error *ngIf="control.touched && control.errors as errors">
      {{ errors | humanReadableError }}
    </mat-error>
  `,
})
export class BooleanValueComponent {
  @Input({ required: true }) control!: FormControl<boolean | null>;
}
