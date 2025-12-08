import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-color-value',
  template: `
    <app-nullable-editor [formControl]="control" [defaultValue]="'#000000'">
      <app-color-picker [formControl]="control" [hexColor]="'#ff0000'"></app-color-picker>
    </app-nullable-editor>

    @if (control && control.errors; as errors) {
      <mat-error>
        {{ errors | humanReadableError }}
      </mat-error>
    }
  `,
  standalone: false,
})
export class ColorValueComponent {
  @Input({ required: true }) control!: FormControl<string | null>;
}
