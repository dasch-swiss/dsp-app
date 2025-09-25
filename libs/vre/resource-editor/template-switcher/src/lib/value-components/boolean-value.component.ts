import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-boolean-value',
  template: `
    <app-nullable-editor [formControl]="control" [defaultValue]="false">
      @if (control.value !== null) {
        <mat-slide-toggle [formControl]="control" data-cy="bool-toggle" style="padding: 16px" />
      }
    </app-nullable-editor>
    @if (control.touched && control.errors; as errors) {
      <mat-error>
        {{ errors | humanReadableError }}
      </mat-error>
    }
  `,
  standalone: false,
})
export class BooleanValueComponent {
  @Input({ required: true }) control!: FormControl<boolean | null>;
}
