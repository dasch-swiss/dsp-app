import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatError } from '@angular/material/form-field';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { HumanReadableErrorPipe } from '@dasch-swiss/vre/ui/ui';
import { NullableEditorComponent } from '../nullable-editor.component';

@Component({
  selector: 'app-boolean-value',
  imports: [NullableEditorComponent, ReactiveFormsModule, MatSlideToggle, MatError, HumanReadableErrorPipe],
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
})
export class BooleanValueComponent {
  @Input({ required: true }) control!: FormControl<boolean | null>;
}
