import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatError } from '@angular/material/form-field';
import { ColorPickerComponent, HumanReadableErrorPipe } from '@dasch-swiss/vre/ui/ui';
import { NullableEditorComponent } from '../nullable-editor.component';

@Component({
  selector: 'app-color-value',
  imports: [NullableEditorComponent, ColorPickerComponent, ReactiveFormsModule, MatError, HumanReadableErrorPipe],
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
})
export class ColorValueComponent {
  @Input({ required: true }) control!: FormControl<string | null>;
}
